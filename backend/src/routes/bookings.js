const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { sendTicketToLineUser, sendTicketsToLineUser } = require('../services/lineService');
const { requireCustomer } = require('../middleware/customerAuth');
const {
  ensureDefaultPromotions,
  calculateOrderPricing
} = require('../services/promotionService');
const {
  getGatewayConfig,
  createVeritransTransaction,
  processSandboxPayment,
  verifyWebhookSignature,
  getVeritransTransactionStatus
} = require('../services/veritransService');

const REAL_LINE_USER_ID_REGEX = /^U[0-9a-f]{32}$/i;

async function resolveRealLineUserId(booking) {
  let candidate = (booking?.customerLineId || '').trim();
  if (REAL_LINE_USER_ID_REGEX.test(candidate)) return candidate;

  // 1. Try matching Customer by username === customerName
  if (booking?.customerName) {
    const cust = await prisma.customer.findFirst({
      where: {
        username: booking.customerName,
        lineUserId: { not: null },
      },
      select: { lineUserId: true },
    });
    if (cust?.lineUserId && REAL_LINE_USER_ID_REGEX.test(cust.lineUserId)) {
      return cust.lineUserId;
    }
  }

  // 2. Try matching any previous booking with a valid 33-char LINE ID
  const recentBookings = await prisma.booking.findMany({
    where: { customerLineId: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: { customerName: true, customerPhone: true, customerLineId: true },
  });

  const exactMatch = recentBookings.find(
    (b) =>
      REAL_LINE_USER_ID_REGEX.test(b.customerLineId || '') &&
      (b.customerPhone === booking?.customerPhone || b.customerName === booking?.customerName)
  );
  if (exactMatch) return exactMatch.customerLineId;

  const fallbackValid = recentBookings.find((b) => REAL_LINE_USER_ID_REGEX.test(b.customerLineId || ''));
  return fallbackValid?.customerLineId || null;
}

async function deliverTicketsToLine(booking, tickets) {
  let targetLineId = await resolveRealLineUserId(booking);
  if (!targetLineId) {
    await prisma.booking.update({ where: { id: booking.id }, data: { lineDeliveryStatus: 'NOT_LINKED', lineDeliveryError: 'ยังไม่มี LINE ID จริงในรายการจอง' } });
    return { status: 'NOT_LINKED', error: 'รายการจองนี้ไม่มี LINE ID' };
  }

  if (targetLineId !== booking.customerLineId) {
    await prisma.booking.update({ where: { id: booking.id }, data: { customerLineId: targetLineId } });
    booking.customerLineId = targetLineId;
  }

  const item = booking.items?.find((entry) => entry.zoneId === tickets[0]?.zoneId);
  const zone = item?.zone || tickets[0]?.zone;
  const concert = zone?.concert || tickets[0]?.zone?.concert;
  if (!zone || !concert) {
    await prisma.booking.update({ where: { id: booking.id }, data: { lineDeliveryStatus: 'FAILED', lineDeliveryError: 'ข้อมูลคอนเสิร์ตของตั๋วไม่ครบ' } });
    return { status: 'FAILED', error: 'ข้อมูลคอนเสิร์ตของตั๋วไม่ครบ' };
  }

  const result = await sendTicketsToLineUser(targetLineId, concert, tickets, zone, booking);
  const status = result.success ? 'SENT' : 'FAILED';
  const error = result.error || result.reason || null;
  await prisma.booking.update({ where: { id: booking.id }, data: { lineDeliveryStatus: status, lineDeliveryError: error } });
  return { status, error };
}

// ─── GET /api/bookings/promotions/active ─────────────────────────────────────
// Public endpoint to list active promotions & VeriTrans gateway info
router.get('/promotions/active', async (req, res) => {
  try {
    await ensureDefaultPromotions();
    const concertId = req.query.concertId ? Number(req.query.concertId) : null;
    const promotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        ...(concertId ? { OR: [{ concertId: null }, { concertId }] } : {}),
      },
      orderBy: [{ category: 'asc' }, { discountValue: 'desc' }],
    });
    res.json({
      success: true,
      gateway: getGatewayConfig(),
      data: promotions,
    });
  } catch (error) {
    console.error('Error fetching active promotions:', error);
    res.status(500).json({ success: false, message: 'ไม่สามารถโหลดข้อมูลโปรโมชันได้' });
  }
});

// ─── POST /api/bookings/promotions/calculate ─────────────────────────────────
// Real-time discount, VAT 7%, WHT 3% & VeriTrans item_details preview
router.post('/promotions/calculate', async (req, res) => {
  try {
    const {
      zoneId,
      unitPrice,
      quantity = 1,
      concertId = null,
      promoCode = '',
      paymentChannel = 'PROMPTPAY',
      withholdingTax = false,
    } = req.body || {};

    let resolvedPrice = Number(unitPrice || 0);
    let resolvedZoneName = 'Concert Ticket';
    let resolvedConcertId = concertId;

    if (zoneId) {
      const zone = await prisma.zone.findUnique({ where: { id: Number(zoneId) } });
      if (zone) {
        resolvedPrice = zone.price;
        resolvedZoneName = zone.name;
        resolvedConcertId = zone.concertId;
      }
    }

    const pricing = await calculateOrderPricing({
      unitPrice: resolvedPrice,
      quantity: Number(quantity || 0),
      concertId: resolvedConcertId,
      promoCode,
      paymentChannel,
      withholdingTax: Boolean(withholdingTax),
      zoneName: resolvedZoneName,
    });

    res.json({
      success: true,
      gateway: getGatewayConfig(),
      data: pricing,
    });
  } catch (error) {
    console.error('Error calculating pricing:', error);
    res.status(500).json({ success: false, message: 'คำนวณส่วนลดและภาษีไม่สำเร็จ' });
  }
});

// GET /api/bookings/zones/:zoneId/occupied-seats - List all occupied/reserved seats
router.get('/zones/:zoneId/occupied-seats', async (req, res) => {
  try {
    const zoneId = parseInt(req.params.zoneId, 10);
    if (isNaN(zoneId)) return res.status(400).json({ success: false, message: 'รหัสโซนไม่ถูกต้อง' });

    // 1. Seats already issued in valid, used, or admin reserved tickets
    const tickets = await prisma.ticket.findMany({
      where: {
        zoneId,
        status: { in: ['VALID', 'USED', 'RESERVED'] },
        seatNumber: { not: null }
      },
      select: { seatNumber: true }
    });
    const ticketSeats = tickets.map((t) => t.seatNumber).filter(Boolean);

    // 2. Seats locked in active pending or reserved bookings (within hold window or reserved by admin)
    const activeBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['PENDING', 'RESERVED'] },
        expiresAt: { gt: new Date() },
        items: { some: { zoneId } }
      },
      select: { selectedSeats: true }
    });

    const pendingSeats = [];
    for (const b of activeBookings) {
      if (b.selectedSeats) {
        try {
          const parsed = JSON.parse(b.selectedSeats);
          if (Array.isArray(parsed)) pendingSeats.push(...parsed);
        } catch (e) {}
      }
    }

    const occupiedSeats = Array.from(new Set([...ticketSeats, ...pendingSeats]));

    res.json({
      success: true,
      zoneId,
      occupiedSeats
    });
  } catch (error) {
    console.error('Error getting occupied seats:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

// POST /api/bookings - Create new reservation with 10-minute hold & unique seat validation (Requires Customer Login)
router.post('/', requireCustomer, async (req, res) => {
  try {
    const {
      concertId,
      zoneId,
      quantity,
      customerName,
      customerPhone,
      customerLineId,
      selectedSeats,
      promoCode = '',
      paymentChannel = 'PROMPTPAY',
      withholdingTax = false,
      taxInvoiceRequested = false,
      taxCompanyName = '',
      taxId = '',
    } = req.body;

    if (!concertId || !zoneId || !quantity || !customerName || !customerPhone) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0 || qty > 6) {
      return res.status(400).json({ success: false, message: 'สามารถจองได้ 1 - 6 ใบต่อครั้ง' });
    }

    // Check zone availability
    const zone = await prisma.zone.findUnique({
      where: { id: parseInt(zoneId, 10) },
      include: { concert: true }
    });

    if (!zone || zone.concertId !== Number(concertId) || zone.available < qty) {
      return res.status(400).json({ success: false, message: 'บัตรในโซนนี้ไม่เพียงพอหรือหมดแล้ว' });
    }
    if (!['ON_SALE'].includes(zone.status) || !['ON_SALE', 'UPCOMING'].includes(zone.concert.status)) {
      return res.status(409).json({ success: false, message: 'คอนเสิร์ตหรือโซนนี้พักการขาย/ปิดการขายแล้ว' });
    }

    if (zone.concert?.status === 'PAUSED') {
      return res.status(400).json({ success: false, message: 'คอนเสิร์ตนี้พักการจำหน่ายบัตรชั่วคราว' });
    }
    if (zone.concert?.status === 'CLOSED' || zone.concert?.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'คอนเสิร์ตนี้ปิดการจำหน่ายบัตรแล้ว' });
    }
    if (zone.isActive === false) {
      return res.status(400).json({ success: false, message: `โซน ${zone.name} พักการจำหน่ายบัตรชั่วคราว` });
    }

    // Validate selectedSeats if provided (Cinema Seat Unique Selection)
    let seatsToReserve = [];
    if (Array.isArray(selectedSeats) && selectedSeats.length > 0) {
      seatsToReserve = selectedSeats.map((s) => String(s).trim()).filter(Boolean);
      
      if (seatsToReserve.length !== qty) {
        return res.status(400).json({
          success: false,
          message: `จำนวนที่นั่งที่เลือก (${seatsToReserve.length} ที่นั่ง) ไม่ตรงกับจำนวนบัตรที่ต้องการ (${qty} ใบ)`
        });
      }

      // Check for duplicate seats within the current selection
      if (new Set(seatsToReserve).size !== seatsToReserve.length) {
        return res.status(400).json({
          success: false,
          message: 'พบที่นั่งซ้ำกันในรายการที่เลือก กรุณาเลือกที่นั่งที่ไม่ซ้ำกัน'
        });
      }
    }

    // Calculate Discounts (Squad Bundle + Coupon + VeriTrans Partner) & Taxes (VAT 7% + WHT 3%)
    const pricing = await calculateOrderPricing({
      unitPrice: zone.price,
      quantity: qty,
      concertId: zone.concertId,
      promoCode,
      paymentChannel,
      withholdingTax: Boolean(withholdingTax),
      zoneName: zone.name,
    });

    // Generate Booking Code: SW-YEAR-RANDOM
    const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const bookingCode = `SW-${new Date().getFullYear()}-${randomCode}`;

    // 10 minutes expiry lock
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const totalAmount = pricing.totalAmount;

    // Create VeriTrans Sandbox Transaction
    const vtTransaction = await createVeritransTransaction({
      booking: {
        bookingCode,
        customerName,
        customerPhone,
        totalAmount,
        promoCode: pricing.appliedCouponPromo?.code || null,
      },
      pricing,
      paymentChannel: pricing.paymentChannel,
    });

    // Use transaction to hold quota and atomically validate seat reservation (Prevents Race Condition)
    let booking;
    try {
      booking = await prisma.$transaction(async (tx) => {
        // 1. Atomically reserve inventory so simultaneous checkouts cannot oversell.
        const reserved = await tx.zone.updateMany({
          where: { id: zone.id, available: { gte: qty } },
          data: { available: { decrement: qty } }
        });
        if (reserved.count !== 1) {
          throw new Error('CAPACITY_EXCEEDED');
        }

        // 2. Atomically check and lock seats inside the transaction
        if (seatsToReserve.length > 0) {
          const conflictTicket = await tx.ticket.findFirst({
            where: {
              zoneId: zone.id,
              status: { in: ['VALID', 'USED', 'RESERVED'] },
              seatNumber: { in: seatsToReserve }
            }
          });

          if (conflictTicket) {
            throw new Error(`SEAT_TAKEN:${conflictTicket.seatNumber}`);
          }

          const activePending = await tx.booking.findMany({
            where: {
              status: { in: ['PENDING', 'RESERVED'] },
              expiresAt: { gt: new Date() },
              items: { some: { zoneId: zone.id } }
            },
            select: { selectedSeats: true }
          });

          for (const b of activePending) {
            if (b.selectedSeats) {
              try {
                const taken = JSON.parse(b.selectedSeats);
                if (Array.isArray(taken)) {
                  const conflict = seatsToReserve.find((s) => taken.includes(s));
                  if (conflict) {
                    throw new Error(`SEAT_HOLD:${conflict}`);
                  }
                }
              } catch (e) {}
            }
          }
        }

        // Increment promotion usage count if applied
        const appliedPromoIds = [
          pricing.appliedBundlePromo?.id,
          pricing.appliedCouponPromo?.id,
          pricing.appliedPartnerPromo?.id,
        ].filter(Boolean);

        for (const promoId of new Set(appliedPromoIds)) {
          await tx.promotion.update({
            where: { id: promoId },
            data: { usedCount: { increment: 1 } },
          });
        }

        return await tx.booking.create({
          data: {
            bookingCode,
            customerName,
            customerPhone,
            customerLineId: customerLineId || req.customer?.lineUserId || null,
            selectedSeats: seatsToReserve.length > 0 ? JSON.stringify(seatsToReserve) : null,
            subtotalAmount: pricing.subtotalAmount,
            discountAmount: pricing.discountAmount,
            bundleDiscount: pricing.bundleDiscount,
            couponDiscount: pricing.couponDiscount,
            partnerDiscount: pricing.partnerDiscount,
            promoCode: pricing.appliedCouponPromo?.code || pricing.appliedBundlePromo?.code || null,
            vatRate: pricing.vatRate,
            vatAmount: pricing.vatAmount,
            whtRate: pricing.whtRate,
            whtAmount: pricing.whtAmount,
            processingFee: pricing.processingFee,
            taxInvoiceRequested: Boolean(taxInvoiceRequested || withholdingTax),
            taxCompanyName: taxCompanyName ? String(taxCompanyName).trim() : null,
            taxId: taxId ? String(taxId).trim() : null,
            totalAmount,
            expiresAt,
            status: 'PENDING',
            paymentMethod: pricing.paymentChannel === 'PROMPTPAY' ? 'VERITRANS_PROMPTPAY' : `VERITRANS_${pricing.paymentChannel}`,
            paymentGateway: 'VERITRANS',
            gatewayOrderId: vtTransaction.orderId,
            gatewaySnapToken: vtTransaction.snapToken,
            gatewayRedirectUrl: vtTransaction.redirectUrl,
            gatewayPayloadJson: JSON.stringify({
              pricing,
              veritrans: vtTransaction,
            }),
            items: {
              create: {
                zoneId: zone.id,
                quantity: qty,
                pricePerUnit: zone.price
              }
            }
          },
          include: {
            items: {
              include: { zone: true }
            }
          }
        });
      });
    } catch (txErr) {
      if (txErr.message === 'CAPACITY_EXCEEDED') {
        return res.status(409).json({ success: false, message: 'บัตรในโซนนี้เพิ่งหมด กรุณาเลือกจำนวนใหม่' });
      }
      if (txErr.message?.startsWith('SEAT_TAKEN:')) {
        const seatName = txErr.message.split(':')[1];
        return res.status(409).json({
          success: false,
          message: `ขออภัย ที่นั่ง ${seatName} มีผู้จองและออกตั๋วไปแล้ว กรุณาเลือกที่นั่งอื่น`
        });
      }
      if (txErr.message?.startsWith('SEAT_HOLD:')) {
        const seatName = txErr.message.split(':')[1];
        return res.status(409).json({
          success: false,
          message: `ขออภัย ที่นั่ง ${seatName} เพิ่งถูกผู้ใช้อื่นทำรายการจองไปเมื่อสักครู่ กรุณาเลือกที่นั่งอื่น`
        });
      }
      throw txErr;
    }

    if (!booking) {
      return res.status(409).json({ success: false, message: 'บัตรในโซนนี้เพิ่งหมด กรุณาเลือกจำนวนใหม่' });
    }

    res.status(201).json({
      success: true,
      message: 'จองสิทธิ์สำเร็จ กรุณาชำระเงินภายใน 10 นาที',
      data: {
        bookingCode: booking.bookingCode,
        customerName: booking.customerName,
        subtotalAmount: booking.subtotalAmount,
        discountAmount: booking.discountAmount,
        vatAmount: booking.vatAmount,
        whtAmount: booking.whtAmount,
        totalAmount: booking.totalAmount,
        expiresAt: booking.expiresAt,
        zoneName: zone.name,
        quantity: qty,
        selectedSeats: seatsToReserve,
        concertName: zone.concert.name,
        pricing,
        veritrans: vtTransaction,
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

// GET /api/bookings/:bookingCode - Check booking status and remaining time
router.get('/:bookingCode', async (req, res) => {
  try {
    const { bookingCode } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
      include: {
        items: {
          include: {
            zone: {
              include: { concert: true }
            }
          }
        },
        tickets: true
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการจอง' });
    }

    // Check if expired
    const now = new Date();
    if (booking.status === 'PENDING' && now > new Date(booking.expiresAt)) {
      // Mark as expired and return quota
      await prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'EXPIRED' }
        });
        for (const item of booking.items) {
          await tx.zone.update({
            where: { id: item.zoneId },
            data: { available: { increment: item.quantity } }
          });
        }
      });
      booking.status = 'EXPIRED';
    }

    let parsedSeats = [];
    if (booking.selectedSeats) {
      try {
        parsedSeats = JSON.parse(booking.selectedSeats);
      } catch (e) {}
    }

    let gatewayMeta = null;
    if (booking.gatewayPayloadJson) {
      try {
        gatewayMeta = JSON.parse(booking.gatewayPayloadJson);
      } catch (e) {}
    }

    // If booking was created before pricing breakdown was stored, compute fallback breakdown
    const item = booking.items?.[0];
    const pricing = gatewayMeta?.pricing || (await calculateOrderPricing({
      unitPrice: item?.pricePerUnit || booking.totalAmount,
      quantity: item?.quantity || 1,
      concertId: item?.zone?.concertId || null,
      promoCode: booking.promoCode || '',
      paymentChannel: booking.paymentMethod?.includes('CREDIT') || booking.paymentMethod?.includes('JCB') ? 'CREDIT_CARD' : 'PROMPTPAY',
      withholdingTax: Boolean(booking.whtAmount > 0),
      zoneName: item?.zone?.name || 'Concert Ticket',
    }));

    res.json({
      success: true,
      gateway: getGatewayConfig(),
      data: {
        ...booking,
        selectedSeatsList: parsedSeats,
        pricing,
        veritrans: gatewayMeta?.veritrans || null,
      }
    });
  } catch (error) {
    console.error('Error getting booking:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

// ─── POST /api/bookings/:bookingCode/recalculate ─────────────────────────────
// Update payment channel (PromptPay vs Credit Card JCB/Visa), Promo Code, or Tax options on Checkout page
router.post('/:bookingCode/recalculate', async (req, res) => {
  try {
    const { bookingCode } = req.params;
    const {
      promoCode,
      paymentChannel = 'PROMPTPAY',
      withholdingTax = false,
      taxInvoiceRequested = false,
      taxCompanyName = '',
      taxId = '',
    } = req.body || {};

    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
      include: {
        items: { include: { zone: { include: { concert: true } } } },
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการจอง' });
    }
    if (booking.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'สามารถเปลี่ยนโปรโมชันหรือช่องทางชำระเงินได้เฉพาะรายการที่รอชำระเท่านั้น' });
    }

    const item = booking.items?.[0];
    const effectivePromoCode = promoCode !== undefined ? promoCode : (booking.promoCode || '');

    const pricing = await calculateOrderPricing({
      unitPrice: item?.pricePerUnit || booking.totalAmount,
      quantity: item?.quantity || 1,
      concertId: item?.zone?.concertId || null,
      promoCode: effectivePromoCode,
      paymentChannel,
      withholdingTax: Boolean(withholdingTax),
      zoneName: item?.zone?.name || 'Concert Ticket',
    });

    const vtTransaction = await createVeritransTransaction({
      booking: {
        ...booking,
        totalAmount: pricing.totalAmount,
        promoCode: pricing.appliedCouponPromo?.code || null,
      },
      pricing,
      paymentChannel: pricing.paymentChannel,
    });

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        subtotalAmount: pricing.subtotalAmount,
        discountAmount: pricing.discountAmount,
        bundleDiscount: pricing.bundleDiscount,
        couponDiscount: pricing.couponDiscount,
        partnerDiscount: pricing.partnerDiscount,
        promoCode: pricing.appliedCouponPromo?.code || pricing.appliedBundlePromo?.code || null,
        vatRate: pricing.vatRate,
        vatAmount: pricing.vatAmount,
        whtRate: pricing.whtRate,
        whtAmount: pricing.whtAmount,
        processingFee: pricing.processingFee,
        taxInvoiceRequested: Boolean(taxInvoiceRequested || withholdingTax),
        taxCompanyName: taxCompanyName ? String(taxCompanyName).trim() : booking.taxCompanyName,
        taxId: taxId ? String(taxId).trim() : booking.taxId,
        totalAmount: pricing.totalAmount,
        paymentMethod: pricing.paymentChannel === 'PROMPTPAY' ? 'VERITRANS_PROMPTPAY' : `VERITRANS_${pricing.paymentChannel}`,
        paymentGateway: 'VERITRANS',
        gatewayOrderId: vtTransaction.orderId,
        gatewaySnapToken: vtTransaction.snapToken,
        gatewayRedirectUrl: vtTransaction.redirectUrl,
        gatewayPayloadJson: JSON.stringify({
          pricing,
          veritrans: vtTransaction,
        }),
      },
      include: {
        items: { include: { zone: { include: { concert: true } } } },
        tickets: true,
      },
    });

    res.json({
      success: true,
      gateway: getGatewayConfig(),
      data: {
        ...updated,
        pricing,
        veritrans: vtTransaction,
      },
    });
  } catch (error) {
    console.error('Error recalculating booking:', error);
    res.status(500).json({ success: false, message: 'อัปเดตยอดส่วนลดและภาษีไม่สำเร็จ' });
  }
});

// Shared helper: Atomic status transition PENDING -> PAID + Ticket issuance + LINE delivery
async function fulfillBookingPayment(bookingCode, { selectedSeatsFallback = [], paymentMethodOverride = null, gatewayCaptureResult = null } = {}) {
  const booking = await prisma.booking.findUnique({
    where: { bookingCode },
    include: {
      items: {
        include: {
          zone: {
            include: { concert: true }
          }
        }
      },
      tickets: true
    }
  });

  if (!booking) {
    return { httpStatus: 404, body: { success: false, message: 'ไม่พบข้อมูลการจอง' } };
  }

  if (booking.status === 'PAID') {
    return {
      httpStatus: 200,
      body: {
        success: true,
        message: 'การจองนี้ชำระเงินเรียบร้อยแล้ว',
        data: {
          bookingCode: booking.bookingCode,
          tickets: booking.tickets,
          gatewayResult: gatewayCaptureResult,
          lineDelivery: {
            status: booking.lineDeliveryStatus || 'UNKNOWN',
            error: booking.lineDeliveryError
          }
        }
      }
    };
  }

  if (booking.status === 'EXPIRED' || new Date() > new Date(booking.expiresAt)) {
    return { httpStatus: 400, body: { success: false, message: 'หมดเวลาชำระเงินแล้ว รายการนี้ถูกยกเลิก' } };
  }

  if (booking.status !== 'PENDING') {
    return {
      httpStatus: 400,
      body: { success: false, message: `ไม่สามารถชำระเงินได้เนื่องจากสถานะปัจจุบันคือ ${booking.status}` }
    };
  }

  let bookingSeats = [];
  if (booking.selectedSeats) {
    try {
      bookingSeats = JSON.parse(booking.selectedSeats);
    } catch (e) {}
  }
  if (!bookingSeats.length && Array.isArray(selectedSeatsFallback)) {
    bookingSeats = selectedSeatsFallback;
  }

  let seatIndex = 0;
  let createdTickets;
  try {
    createdTickets = await prisma.$transaction(async (tx) => {
      const updateData = {
        status: 'PAID',
        paidAt: new Date()
      };
      if (paymentMethodOverride) {
        updateData.paymentMethod = paymentMethodOverride;
      }
      if (gatewayCaptureResult) {
        let prevMeta = {};
        try {
          prevMeta = JSON.parse(booking.gatewayPayloadJson || '{}');
        } catch (e) {}
        updateData.gatewayPayloadJson = JSON.stringify({
          ...prevMeta,
          captureResult: gatewayCaptureResult,
        });

        // Capture Midtrans Promo Engine discount if gross_amount paid in Snap differs from initial total
        const capturedGross = Math.round(Number(gatewayCaptureResult.gross_amount || 0));
        const promoDiscountFromApi = Math.round(Number(gatewayCaptureResult.promo_discount || 0));
        if (capturedGross > 0 && capturedGross < booking.totalAmount) {
          const midtransDiscount = promoDiscountFromApi > 0 ? promoDiscountFromApi : booking.totalAmount - capturedGross;
          updateData.discountAmount = (booking.discountAmount || 0) + midtransDiscount;
          updateData.couponDiscount = (booking.couponDiscount || 0) + midtransDiscount;
          updateData.totalAmount = capturedGross;
          updateData.promoCode =
            gatewayCaptureResult.promo_code ||
            gatewayCaptureResult.promo_id ||
            booking.promoCode ||
            'MIDTRANS_PROMO';
        } else if (gatewayCaptureResult.promo_code) {
          updateData.promoCode = gatewayCaptureResult.promo_code;
        }
      }

      const updateResult = await tx.booking.updateMany({
        where: {
          id: booking.id,
          status: 'PENDING',
          expiresAt: { gt: new Date() }
        },
        data: updateData
      });

      if (updateResult.count !== 1) {
        throw new Error('ALREADY_PAID_OR_EXPIRED');
      }

      const existingCount = await tx.ticket.count({
        where: { bookingId: booking.id }
      });
      if (existingCount > 0) {
        throw new Error('TICKETS_ALREADY_ISSUED');
      }

      const ticketsList = [];
      for (const item of booking.items) {
        for (let i = 0; i < item.quantity; i++) {
          const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
          const catCode = (item.zone.category || 'TKT')
            .replace(/[^a-zA-Z0-9]/g, '')
            .slice(0, 4)
            .toUpperCase() || 'PASS';
          const ticketCode = `SWP-${catCode}-${randomSuffix}-${Date.now().toString().slice(-4)}`;

          const isSeatCategory = /seat|chair|นั่ง|vip/i.test(item.zone.category || '');
          const fallbackSeat = isSeatCategory
            ? `ROW-A-${String(seatIndex + 1).padStart(2, '0')}`
            : `SPOT-${String(seatIndex + 1).padStart(2, '0')}`;

          const seat = bookingSeats[seatIndex] || fallbackSeat;
          seatIndex++;

          if (seat) {
            const seatAlreadyClaimed = await tx.ticket.findFirst({
              where: {
                zoneId: item.zoneId,
                status: { in: ['VALID', 'USED', 'RESERVED'] },
                seatNumber: seat,
                bookingId: { not: booking.id }
              }
            });
            if (seatAlreadyClaimed) {
              throw new Error(`SEAT_ALREADY_CLAIMED:${seat}`);
            }
          }

          const ticket = await tx.ticket.create({
            data: {
              ticketCode,
              bookingId: booking.id,
              zoneId: item.zoneId,
              attendeeName: booking.customerName,
              seatNumber: seat,
              status: 'VALID'
            }
          });
          ticketsList.push(ticket);
        }
      }
      return ticketsList;
    });
  } catch (txError) {
    if (txError.message?.startsWith('SEAT_ALREADY_CLAIMED:')) {
      const seatName = txError.message.split(':')[1];
      return {
        httpStatus: 409,
        body: {
          success: false,
          message: `ไม่สามารถออกตั๋วได้ เนื่องจากที่นั่ง ${seatName} มีผู้ชำระเงินตัดหน้าไปก่อนแล้ว`
        }
      };
    }
    if (txError.message === 'ALREADY_PAID_OR_EXPIRED' || txError.message === 'TICKETS_ALREADY_ISSUED') {
      const latestBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: { tickets: true }
      });
      if (latestBooking && latestBooking.status === 'PAID') {
        return {
          httpStatus: 200,
          body: {
            success: true,
            message: 'การจองนี้ชำระเงินเรียบร้อยแล้ว',
            data: {
              bookingCode: latestBooking.bookingCode,
              booking: latestBooking,
              tickets: latestBooking.tickets,
              gatewayResult: gatewayCaptureResult,
              lineDelivery: {
                status: latestBooking.lineDeliveryStatus || 'UNKNOWN',
                error: latestBooking.lineDeliveryError
              }
            }
          }
        };
      }
      return {
        httpStatus: 400,
        body: { success: false, message: 'หมดเวลาชำระเงินแล้ว หรือรายการนี้ถูกดำเนินการไปแล้ว' }
      };
    }
    throw txError;
  }

  const updatedBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
  const lineDelivery = await deliverTicketsToLine(updatedBooking || booking, createdTickets);

  return {
    httpStatus: 200,
    body: {
      success: true,
      message: 'ชำระเงินผ่าน VeriTrans สำเร็จ ออกตั๋วคอนเสิร์ตเรียบร้อย',
      data: {
        bookingCode: booking.bookingCode,
        booking: updatedBooking || booking,
        tickets: createdTickets,
        gatewayResult: gatewayCaptureResult,
        lineDelivery
      }
    }
  };
}

// POST /api/bookings/:bookingCode/pay - Confirm / Process VeriTrans Payment (Supports both QR PromptPay & Credit/Debit Card)
router.post('/:bookingCode/pay', async (req, res) => {
  try {
    const { bookingCode } = req.params;
    const {
      selectedSeats,
      paymentChannel = 'PROMPTPAY',
      cardNumber = '',
      cardHolder = '',
      cardExpiry = '',
      cardCvv = '',
      snapResult = null,
    } = req.body || {};

    const booking = await prisma.booking.findUnique({ where: { bookingCode } });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการจอง' });
    }

    // If paid directly through Midtrans Snap Popup / Hosted Page, verify & extract promo_details from Midtrans Status API
    let vtResult;
    if (snapResult && (snapResult.transaction_id || snapResult.order_id)) {
      const targetOrderId = snapResult.order_id || booking.gatewayOrderId;
      const mtStatus = await getVeritransTransactionStatus(targetOrderId);
      const mtPromo = mtStatus?.promo_details || {};
      const maskedCard = mtStatus?.masked_card || '';
      const resolvedBrand = maskedCard.startsWith('4')
        ? 'VISA'
        : maskedCard.startsWith('5')
        ? 'MASTERCARD'
        : maskedCard.startsWith('35')
        ? 'JCB'
        : String(mtStatus?.payment_type || snapResult.payment_type || paymentChannel).toUpperCase();

      vtResult = {
        success: true,
        status_code: mtStatus?.status_code || snapResult.status_code || '200',
        status_message: mtStatus?.status_message || snapResult.status_message || 'Midtrans Snap Payment Captured',
        transaction_id: mtStatus?.transaction_id || snapResult.transaction_id || snapResult.order_id,
        order_id: mtStatus?.order_id || targetOrderId,
        gross_amount: Number(mtStatus?.gross_amount || snapResult.gross_amount) || booking.totalAmount,
        payment_type: mtStatus?.payment_type || snapResult.payment_type || paymentChannel,
        card_brand: resolvedBrand,
        masked_card: maskedCard || null,
        bank: mtStatus?.bank || null,
        promo_id: mtPromo.promo_id || snapResult.promo_id || null,
        promo_code: mtPromo.code || snapResult.promo_code || null,
        promo_name: mtPromo.name || null,
        promo_discount: Number(mtPromo.discount_amount || 0) || null,
      };
    } else {
      // Process through VeriTrans Sandbox Processor (handles both QR PromptPay & Credit Card verification)
      vtResult = processSandboxPayment({
        bookingCode,
        orderId: booking.gatewayOrderId || `${bookingCode}-VT`,
        amount: booking.totalAmount,
        paymentChannel,
        cardNumber,
        cardHolder,
        cardExpiry,
        cardCvv,
      });
    }

    if (!vtResult.success) {
      return res.status(402).json({
        success: false,
        message: vtResult.status_message,
        gatewayResult: vtResult,
      });
    }

    const methodLabel =
      paymentChannel === 'PROMPTPAY'
        ? `VERITRANS_PROMPTPAY:${vtResult.transaction_id}`
        : `VERITRANS_CARD_${vtResult.card_brand || 'VISA'}:${vtResult.transaction_id}`;

    const result = await fulfillBookingPayment(bookingCode, {
      selectedSeatsFallback: selectedSeats,
      paymentMethodOverride: methodLabel,
      gatewayCaptureResult: vtResult,
    });
    res.status(result.httpStatus).json(result.body);
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

// POST /api/webhooks/veritrans - Official VeriTrans / Midtrans Webhook Notification Handler
async function handleVeritransWebhook(req, res) {
  try {
    const notification = req.body || {};
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_id,
      custom_field1,
    } = notification;

    if (!order_id && !custom_field1) {
      return res.status(400).json({ success: false, message: 'Invalid VeriTrans webhook payload' });
    }

    if (!verifyWebhookSignature({ order_id, status_code, gross_amount, signature_key })) {
      return res.status(403).json({ success: false, message: 'Invalid VeriTrans signature_key' });
    }

    const isPaid =
      (transaction_status === 'capture' && (!fraud_status || fraud_status === 'accept')) ||
      transaction_status === 'settlement';

    if (!isPaid) {
      return res.json({
        success: true,
        processed: false,
        transaction_status,
      });
    }

    // Match booking by custom_field1 (bookingCode) or gatewayOrderId
    let bookingCode = custom_field1;
    if (!bookingCode && order_id) {
      const matched = await prisma.booking.findFirst({
        where: {
          OR: [
            { gatewayOrderId: order_id },
            { bookingCode: order_id.split('-').slice(0, 3).join('-') },
          ],
        },
        select: { bookingCode: true },
      });
      bookingCode = matched?.bookingCode;
    }

    if (!bookingCode) {
      return res.status(404).json({ success: false, message: 'No matching booking found for VeriTrans order' });
    }

    const result = await fulfillBookingPayment(bookingCode, {
      paymentMethodOverride: `VERITRANS_${String(payment_type || 'WEBHOOK').toUpperCase()}:${transaction_id || order_id}`,
      gatewayCaptureResult: notification,
    });
    return res.status(result.httpStatus).json(result.body);
  } catch (error) {
    console.error('Error handling VeriTrans webhook:', error);
    return res.status(500).json({ success: false, message: 'VeriTrans webhook processing error' });
  }
}

router.post('/webhooks/veritrans', handleVeritransWebhook);

// POST /api/bookings/:bookingCode/line-resend - Retry ticket delivery after payment
router.post('/:bookingCode/line-resend', async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { bookingCode: req.params.bookingCode },
      include: {
        items: { include: { zone: { include: { concert: true } } } },
        tickets: { include: { zone: { include: { concert: true } } } }
      }
    });
    if (!booking) return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการจอง' });
    if (booking.status !== 'PAID') return res.status(400).json({ success: false, message: 'ส่งตั๋วได้หลังชำระเงินสำเร็จเท่านั้น' });
    const lineDelivery = await deliverTicketsToLine(booking, booking.tickets);
    res.json({ success: true, data: { lineDelivery } });
  } catch (error) {
    console.error('LINE ticket retry failed:', error);
    res.status(500).json({ success: false, message: 'ลองส่งตั๋วเข้า LINE อีกครั้งไม่สำเร็จ' });
  }
});

router.handleVeritransWebhook = handleVeritransWebhook;
module.exports = router;
