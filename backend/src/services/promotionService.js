const prisma = require('../lib/prisma');

let seededChecked = false;

const DEFAULT_PROMOTIONS = [
  {
    code: 'SQUAD4PAY3',
    name: 'โปรแก๊งเพื่อน มา 4 จ่าย 3 (ลด 25%)',
    description: 'ชวนเพื่อนมาครบ 4 ใบขึ้นไป รับส่วนลดอัตโนมัติทันที 25% (เทียบเท่าฟรี 1 ใบ สูงสุด 3,000 บาท)',
    category: 'AUTO_BUNDLE',
    discountType: 'PERCENT',
    discountValue: 25,
    maxDiscount: 3000,
    minTickets: 4,
    minSpend: 0,
    paymentChannel: 'ALL',
    maxUses: 200,
    isActive: true,
  },
  {
    code: 'DUOPACK5',
    name: 'โปรคู่หูดูคอนเสิร์ต (2-3 ใบ ลด 5%)',
    description: 'ซื้อบัตรตั้งแต่ 2 ใบขึ้นไป ลดอัตโนมัติทันที 5% สูงสุด 500 บาท',
    category: 'AUTO_BUNDLE',
    discountType: 'PERCENT',
    discountValue: 5,
    maxDiscount: 500,
    minTickets: 2,
    minSpend: 0,
    paymentChannel: 'ALL',
    maxUses: 500,
    isActive: true,
  },
  {
    code: 'EARLYBIRD15',
    name: 'Early Bird Special ลด 15%',
    description: 'โค้ดลดพิเศษช่วง Early Bird ลด 15% เมื่อจองครบ 1,000 บาท (ลดสูงสุด 600 บาท)',
    category: 'COUPON',
    discountType: 'PERCENT',
    discountValue: 15,
    maxDiscount: 600,
    minTickets: 1,
    minSpend: 1000,
    paymentChannel: 'ALL',
    maxUses: 100,
    isActive: true,
  },
  {
    code: 'SOUNDWAVE300',
    name: 'SoundWave Rockers ลดทันที 300 บาท',
    description: 'คูปองส่วนลดเงินสด 300 บาท เมื่อมียอดซื้อบัตรตั้งแต่ 2,000 บาทขึ้นไป',
    category: 'COUPON',
    discountType: 'FIXED',
    discountValue: 300,
    maxDiscount: 300,
    minTickets: 1,
    minSpend: 2000,
    paymentChannel: 'ALL',
    maxUses: 80,
    isActive: true,
  },
  {
    code: 'VIPPASS600',
    name: 'VIP Festival Exclusive ลด 600 บาท',
    description: 'ส่วนลดพิเศษ 600 บาท สำหรับยอดซื้อครบ 4,000 บาทขึ้นไป',
    category: 'COUPON',
    discountType: 'FIXED',
    discountValue: 600,
    maxDiscount: 600,
    minTickets: 1,
    minSpend: 4000,
    paymentChannel: 'ALL',
    maxUses: 50,
    isActive: true,
  },
  {
    code: 'VTJCB5',
    name: 'VeriTrans Credit Card Sponsor ลดเพิ่ม 5%',
    description: 'สิทธิพิเศษผู้สนับสนุนหลัก! ชำระด้วยบัตรเครดิต/เดบิต (JCB / Visa / Mastercard) ผ่าน VeriTrans ลดเพิ่มอีก 5% สูงสุด 300 บาท',
    category: 'PAYMENT_PARTNER',
    discountType: 'PERCENT',
    discountValue: 5,
    maxDiscount: 300,
    minTickets: 1,
    minSpend: 0,
    paymentChannel: 'CREDIT_CARD',
    maxUses: 1000,
    isActive: true,
  },
];

async function ensureDefaultPromotions() {
  if (seededChecked) return;
  try {
    const count = await prisma.promotion.count();
    if (count === 0) {
      for (const promo of DEFAULT_PROMOTIONS) {
        await prisma.promotion.upsert({
          where: { code: promo.code },
          create: promo,
          update: {},
        });
      }
    }
    seededChecked = true;
  } catch (err) {
    console.warn('Could not seed default promotions yet:', err.message);
  }
}

function computeRawDiscount(promo, baseAmount) {
  if (!promo || baseAmount <= 0) return 0;
  let discount = 0;
  if (promo.discountType === 'PERCENT') {
    discount = Math.round((baseAmount * Number(promo.discountValue || 0)) / 100);
    if (promo.maxDiscount && Number(promo.maxDiscount) > 0) {
      discount = Math.min(discount, Number(promo.maxDiscount));
    }
  } else {
    discount = Math.round(Number(promo.discountValue || 0));
  }
  return Math.max(0, Math.min(discount, baseAmount));
}

function isPromoValidForOrder(promo, { quantity, subtotal, concertId, now = new Date() }) {
  if (!promo || !promo.isActive) return { valid: false, reason: 'โปรโมชันปิดใช้งานชั่วคราว' };
  if (promo.expiresAt && new Date(promo.expiresAt) < now) {
    return { valid: false, reason: 'โปรโมชันหมดอายุแล้ว' };
  }
  if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
    return { valid: false, reason: 'สิทธิ์โปรโมชันเต็มแล้ว (Sold Out)' };
  }
  if (promo.concertId && concertId && Number(promo.concertId) !== Number(concertId)) {
    return { valid: false, reason: 'ใช้ได้เฉพาะคอนเสิร์ตที่กำหนดเท่านั้น' };
  }
  if (quantity < (promo.minTickets || 1)) {
    return {
      valid: false,
      reason: `ต้องจองอย่างน้อย ${promo.minTickets} ใบ (ขาดอีก ${promo.minTickets - quantity} ใบ)`,
      missingTickets: promo.minTickets - quantity,
    };
  }
  if (subtotal < (promo.minSpend || 0)) {
    return {
      valid: false,
      reason: `ยอดซื้อขั้นต่ำ ฿${Number(promo.minSpend).toLocaleString()} (ขาดอีก ฿${(promo.minSpend - subtotal).toLocaleString()})`,
      missingSpend: promo.minSpend - subtotal,
    };
  }
  return { valid: true, reason: null };
}

async function calculateOrderPricing({
  unitPrice = 0,
  quantity = 1,
  concertId = null,
  promoCode = '',
  paymentChannel = 'PROMPTPAY', // PROMPTPAY | CREDIT_CARD | JCB | VISA | MASTERCARD
  withholdingTax = false,       // หักภาษี ณ ที่จ่าย 3% สำหรับนิติบุคคล
  zoneName = 'Concert Ticket',
}) {
  await ensureDefaultPromotions();

  const qty = Math.max(0, Number(quantity) || 0);
  const price = Math.max(0, Number(unitPrice) || 0);
  const subtotal = Math.round(price * qty);
  const normalizedChannel = String(paymentChannel || 'PROMPTPAY').toUpperCase();

  // Promotions & discounts are now managed directly in Midtrans Dashboard Promo Engine
  // (https://dashboard.sandbox.midtrans.com/promo/create) to avoid double-discounting.
  const bundleDiscount = 0;
  const couponDiscount = 0;
  const partnerDiscount = 0;
  const totalDiscount = 0;
  const netBeforeTax = subtotal;

  // ── Tax & Gateway Fee Calculation (VAT 7% & WHT 3% stays in SoundWave Tax Engine) ──
  const vatRate = 7;
  const vatAmount = qty > 0 ? Math.round(netBeforeTax * (vatRate / 100)) : 0;
  const whtRate = withholdingTax ? 3 : 0;
  const whtAmount = withholdingTax && qty > 0 ? Math.round(netBeforeTax * (whtRate / 100)) : 0;
  const processingFee = 0;

  const totalAmount = qty > 0 ? Math.max(1, netBeforeTax + vatAmount - whtAmount + processingFee) : 0;

  // ── VeriTrans / Midtrans item_details array (sum must equal gross_amount) ─
  const itemDetails = [];
  if (qty > 0) {
    itemDetails.push({
      id: 'CONCERT-TICKET',
      name: `${zoneName} (${qty} ใบ)`.slice(0, 50),
      price: price,
      quantity: qty,
    });
    if (vatAmount > 0) {
      itemDetails.push({
        id: 'TAX-VAT7',
        name: 'VAT 7% (ภาษีมูลค่าเพิ่ม)',
        price: vatAmount,
        quantity: 1,
      });
    }
    if (whtAmount > 0) {
      itemDetails.push({
        id: 'TAX-WHT3',
        name: 'Withholding Tax 3% (หัก ณ ที่จ่าย)',
        price: -whtAmount,
        quantity: 1,
      });
    }
  }

  return {
    unitPrice: price,
    quantity: qty,
    subtotalAmount: subtotal,
    bundleDiscount,
    appliedBundlePromo: null,
    upsellHint: null,
    couponDiscount,
    appliedCouponPromo: null,
    couponError: null,
    partnerDiscount,
    appliedPartnerPromo: null,
    discountAmount: totalDiscount,
    netBeforeTax,
    vatRate,
    vatAmount,
    whtRate,
    whtAmount,
    processingFee,
    totalAmount,
    paymentChannel: normalizedChannel,
    promoEngine: 'MIDTRANS_DASHBOARD',
    availableCoupons: [],
    partnerPromos: [],
    veritransItemDetails: itemDetails,
  };
}

module.exports = {
  ensureDefaultPromotions,
  calculateOrderPricing,
  DEFAULT_PROMOTIONS,
};
