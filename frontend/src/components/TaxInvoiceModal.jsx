import React, { useEffect } from 'react';
import { FileText, Printer, X, ShieldCheck, CheckCircle2, Building2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function TaxInvoiceModal({ booking, onClose }) {
  const { lang, t, trData } = useLanguage();

  useEffect(() => {
    if (!booking) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [booking, onClose]);

  if (!booking) return null;

  const pricing = booking.pricing || {};
  const item = booking.items?.[0] || {};
  const zoneName = item.zone?.name || booking.zoneName || 'Concert Ticket';
  const concertName = item.zone?.concert?.name || booking.concertName || 'SoundWave Pass Live';
  const qty = item.quantity || booking.quantity || 1;
  const subtotal =
    pricing.subtotalAmount ||
    booking.subtotalAmount ||
    (item.pricePerUnit ? item.pricePerUnit * qty : booking.totalAmount || 0);
  const bundleDiscount = pricing.bundleDiscount ?? booking.bundleDiscount ?? 0;
  const couponDiscount = pricing.couponDiscount ?? booking.couponDiscount ?? 0;
  const partnerDiscount = pricing.partnerDiscount ?? booking.partnerDiscount ?? 0;
  const totalDiscount =
    pricing.discountAmount ?? booking.discountAmount ?? bundleDiscount + couponDiscount + partnerDiscount;
  const netBeforeTax = Math.max(0, subtotal - totalDiscount);
  const vatAmount =
    (pricing.vatAmount ?? booking.vatAmount ?? 0) > 0
      ? pricing.vatAmount ?? booking.vatAmount
      : Math.round(((booking.totalAmount || 0) * 7) / 107);
  const whtAmount = pricing.whtAmount ?? booking.whtAmount ?? 0;
  const totalAmount = booking.totalAmount || 0;

  const invoiceNo = `INV-${booking.bookingCode}`;
  const issuedDate = booking.paidAt || booking.createdAt || new Date().toISOString();
  const formattedDate = new Date(issuedDate).toLocaleDateString(lang === 'en' ? 'en-GB' : 'th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handlePrintA4Invoice = () => {
    const printWin = window.open('', '_blank', 'width=850,height=950');
    if (!printWin) {
      window.print();
      return;
    }

    const localizedConcert = trData(concertName);
    const localizedZone = trData(zoneName);
    const html = `
      <!DOCTYPE html>
      <html lang="${lang === 'en' ? 'en' : 'th'}">
      <head>
        <meta charset="utf-8" />
        <title>${t('ใบกำกับภาษี', 'Tax Invoice')} ${invoiceNo}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #0f172a; margin: 0; padding: 32px; background: #fff; }
          .sheet { max-width: 760px; margin: 0 auto; border: 1.5px solid #cbd5e1; border-radius: 16px; padding: 32px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
          .brand { font-size: 22px; font-weight: 900; color: #0284c7; }
          .doc-title { font-size: 18px; font-weight: 900; text-align: right; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; font-size: 13px; }
          .box { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; background: #f8fafc; }
          .box h4 { margin: 0 0 8px 0; font-size: 12px; color: #475569; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
          th { background: #f1f5f9; text-align: left; padding: 10px 12px; border-bottom: 1.5px solid #cbd5e1; font-weight: 800; }
          td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
          .right { text-align: right; font-family: monospace; font-size: 14px; }
          .total-row td { font-weight: 900; font-size: 16px; background: #f0f9ff; border-top: 2px solid #0284c7; }
          .footer { margin-top: 28px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 16px; }
          @media print { body { padding: 0; } .sheet { border: none; } }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div>
              <div class="brand">⚡ SOUNDWAVE PASS</div>
              <div style="font-size:12px;color:#475569;margin-top:4px;">
                ${t(
                  'บริษัท ซาวด์เวฟ พาส เอ็นเตอร์เทนเมนท์ จำกัด (สำนักงานใหญ่)',
                  'SoundWave Pass Entertainment Co., Ltd. (Head Office)'
                )}<br/>
                ${t('เลขประจำตัวผู้เสียภาษี:', 'Tax ID:')} 0105569000999
              </div>
            </div>
            <div class="doc-title">
              ${t('ใบกำกับภาษี / ใบเสร็จรับเงิน', 'TAX INVOICE / OFFICIAL RECEIPT')}<br/>
              <span style="font-size:12px;color:#0284c7;">${t(
                'TAX INVOICE / OFFICIAL RECEIPT',
                'ELECTRONIC TAX RECEIPT'
              )}</span><br/>
              <span style="font-size:12px;font-family:monospace;">${t('เลขที่:', 'No.:')} ${invoiceNo}</span>
            </div>
          </div>

          <div class="meta-grid">
            <div class="box">
              <h4>${t('ข้อมูลผู้ซื้อ / นิติบุคคล (Customer / Tax Entity)', 'Customer / Tax Entity')}</h4>
              <div><strong>${t('ชื่อผู้ซื้อ / บริษัท:', 'Buyer / Company:')}</strong> ${booking.taxCompanyName || booking.customerName || '—'}</div>
              <div style="margin-top:4px;"><strong>${t('เลขประจำตัวผู้เสียภาษี (13 หลัก):', 'Tax ID (13 digits):')}</strong> <span style="font-family:monospace;font-weight:bold;">${booking.taxId || t('— (บุคคลธรรมดา)', '— (Individual)')}</span></div>
              <div style="margin-top:4px;"><strong>${t('โทรศัพท์:', 'Phone:')}</strong> ${booking.customerPhone || '—'}</div>
            </div>
            <div class="box">
              <h4>${t('ข้อมูลการชำระเงิน (Payment Details)', 'Payment Details')}</h4>
              <div><strong>${t('รหัสการจอง (Booking Code):', 'Booking Code:')}</strong> <span style="font-family:monospace;">${booking.bookingCode}</span></div>
              <div style="margin-top:4px;"><strong>${t('วันที่ออกเอกสาร:', 'Issue Date:')}</strong> ${formattedDate}</div>
              <div style="margin-top:4px;"><strong>${t('เกตเวย์ชำระเงิน:', 'Payment Gateway:')}</strong> VeriTrans (${booking.paymentMethod || 'VERITRANS'})</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>${t('รายการ (Description)', 'Description')}</th>
                <th class="right">${t('จำนวนเงิน (THB)', 'Amount (THB)')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${t(
                  `บัตรคอนเสิร์ต ${localizedConcert} — โซน ${localizedZone} (${qty} ใบ)`,
                  `Concert Tickets: ${localizedConcert} — Zone ${localizedZone} (${qty} ${qty > 1 ? 'tickets' : 'ticket'})`
                )}</td>
                <td class="right">฿${subtotal.toLocaleString()}</td>
              </tr>
              ${
                bundleDiscount > 0
                  ? `<tr><td style="color:#047857;">${t('หัก ส่วนลดแก๊งเพื่อนอัตโนมัติ (Squad Bundle Discount)', 'Less Squad Bundle Auto Discount')}</td><td class="right" style="color:#047857;">-฿${bundleDiscount.toLocaleString()}</td></tr>`
                  : ''
              }
              ${
                couponDiscount > 0
                  ? `<tr><td style="color:#0284c7;">${t(`หัก ส่วนลดคูปอง (${booking.promoCode || 'PROMO'})`, `Less Coupon Discount (${booking.promoCode || 'PROMO'})`)}</td><td class="right" style="color:#0284c7;">-฿${couponDiscount.toLocaleString()}</td></tr>`
                  : ''
              }
              ${
                partnerDiscount > 0
                  ? `<tr><td style="color:#be185d;">${t('หัก ส่วนลดพาร์ทเนอร์ VeriTrans Credit Card', 'Less VeriTrans Credit Card Partner Discount')}</td><td class="right" style="color:#be185d;">-฿${partnerDiscount.toLocaleString()}</td></tr>`
                  : ''
              }
              <tr>
                <td><strong>${t('มูลค่าสินค้า/บริการหลังหักส่วนลด (ก่อนภาษี)', 'Discounted Subtotal (Before Tax)')}</strong></td>
                <td class="right"><strong>฿${netBeforeTax.toLocaleString()}</strong></td>
              </tr>
              <tr>
                <td>${t('ภาษีมูลค่าเพิ่ม 7% (VAT 7%)', 'Value Added Tax (VAT 7%)')}</td>
                <td class="right">+฿${vatAmount.toLocaleString()}</td>
              </tr>
              ${
                whtAmount > 0
                  ? `<tr><td style="color:#6d28d9;">${t('หัก ภาษีหัก ณ ที่จ่าย 3% (Withholding Tax 3%)', 'Less Withholding Tax (WHT 3%)')}</td><td class="right" style="color:#6d28d9;">-฿${whtAmount.toLocaleString()}</td></tr>`
                  : ''
              }
              <tr class="total-row">
                <td>${t('ยอดชำระสุทธิ (Net Total Paid)', 'Net Total Paid')}</td>
                <td class="right">฿${totalAmount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <div>${t('ออกและรับรองโดยระบบอิเล็กทรอนิกส์ SoundWave Pass x VeriTrans Gateway', 'Issued electronically by SoundWave Pass x VeriTrans Gateway')}</div>
            <div>${t('สถานะ:', 'Status:')} <strong>${t('ชำระเงินเรียบร้อยแล้ว (PAID)', 'PAID')}</strong></div>
          </div>
        </div>
        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `;
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="tax-invoice-modal relative w-full max-w-xl rounded-3xl border border-white/15 bg-[#101018] p-4 sm:p-6 text-white shadow-2xl my-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
              <FileText size={20} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                  {invoiceNo}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 border border-emerald-400/30 px-2 py-0.5 text-[9px] font-black text-emerald-300">
                  <CheckCircle2 size={10} /> PAID
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white truncate">
                {t('ใบกำกับภาษี / ใบเสร็จรับเงินเต็มรูป', 'Official Tax Invoice / Receipt')}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
            aria-label={t('ปิดหน้าต่าง', 'Close modal')}
            title={t('ปิดหน้าต่าง (Esc)', 'Close (Esc)')}
            className="tax-modal-close-btn relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-gray-300 hover:bg-rose-500/20 hover:border-rose-400/40 hover:text-rose-200 transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Seller & Buyer Info Grid */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
          <div className="concert-inner-box rounded-2xl border border-white/10 bg-[#12121a] p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1">
              <Building2 size={12} />
              {t('ข้อมูลผู้ขอใบกำกับภาษี (ผู้ซื้อ)', 'Buyer / Tax Entity')}
            </span>
            <p className="font-black text-white break-words">
              {booking.taxCompanyName || booking.customerName || '—'}
            </p>
            <p className="font-mono text-[11px] text-gray-300">
              {t('เลขผู้เสียภาษี 13 หลัก:', 'Tax ID (13 digits):')}{' '}
              <strong className="text-cyan-300">
                {booking.taxId || t('ไม่ได้ระบุ (บุคคลธรรมดา)', 'Individual')}
              </strong>
            </p>
            <p className="text-[11px] text-gray-400">
              {t('เบอร์โทรศัพท์:', 'Phone:')} {booking.customerPhone || '—'}
            </p>
          </div>

          <div className="concert-inner-box rounded-2xl border border-white/10 bg-[#12121a] p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
              <ShieldCheck size={12} />
              {t('ข้อมูลเอกสาร & เกตเวย์', 'Document & Gateway Info')}
            </span>
            <p className="font-bold text-white">SoundWave Pass Entertainment</p>
            <p className="font-mono text-[11px] text-gray-300">
              {t('รหัสใบจอง:', 'Booking:')} <strong className="text-white">{booking.bookingCode}</strong>
            </p>
            <p className="text-[11px] text-gray-400">
              {t('วันที่ชำระ:', 'Date:')} {formattedDate}
            </p>
          </div>
        </div>

        {/* Price, Discount & Tax Breakdown Table */}
        <div className="price-breakdown-box mt-4 rounded-2xl border border-white/15 bg-[#12121a] p-4 text-xs space-y-2">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
            <span className="price-label font-bold text-white break-words">
              {trData(concertName)} — {t('โซน', 'Zone')} {trData(zoneName)} ({qty} {t('ใบ', 'tickets')})
            </span>
            <span className="price-val font-mono font-bold text-white shrink-0">
              ฿{subtotal.toLocaleString()}
            </span>
          </div>

          {bundleDiscount > 0 && (
            <div className="flex items-center justify-between gap-2">
              <span className="price-label-discount text-emerald-300 font-semibold">
                {t('หัก ส่วนลดแก๊งเพื่อนอัตโนมัติ:', 'Less Squad Bundle Discount:')}
              </span>
              <span className="price-val-emerald font-mono font-black text-emerald-300">
                -฿{bundleDiscount.toLocaleString()}
              </span>
            </div>
          )}

          {couponDiscount > 0 && (
            <div className="flex items-center justify-between gap-2">
              <span className="price-label-coupon text-cyan-300 font-semibold">
                {t('หัก ส่วนลดคูปอง', 'Less Coupon Discount')} ({booking.promoCode || 'PROMO'}):
              </span>
              <span className="price-val-cyan font-mono font-black text-cyan-300">
                -฿{couponDiscount.toLocaleString()}
              </span>
            </div>
          )}

          {partnerDiscount > 0 && (
            <div className="flex items-center justify-between gap-2">
              <span className="price-label-partner text-pink-300 font-semibold">
                {t('หัก ส่วนลดพาร์ทเนอร์ VeriTrans:', 'Less VeriTrans Partner Promo:')}
              </span>
              <span className="price-val-pink font-mono font-black text-pink-300">
                -฿{partnerDiscount.toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/10">
            <span className="price-label text-gray-200 font-bold">
              {t('มูลค่าหลังหักส่วนลด (ก่อนภาษี):', 'Discounted Subtotal (Before Tax):')}
            </span>
            <span className="price-val font-mono font-bold text-white">
              ฿{netBeforeTax.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="price-label-vat text-amber-300 font-semibold">
              {t('ภาษีมูลค่าเพิ่ม 7% (VAT 7%):', 'Value Added Tax (VAT 7%):')}
            </span>
            <span className="price-val-amber font-mono font-bold text-amber-300">
              +฿{vatAmount.toLocaleString()}
            </span>
          </div>

          {whtAmount > 0 && (
            <div className="flex items-center justify-between gap-2">
              <span className="price-label-wht text-purple-300 font-semibold">
                {t('หัก ภาษีหัก ณ ที่จ่าย 3% (WHT 3%):', 'Withholding Tax (WHT 3%):')}
              </span>
              <span className="price-val-purple font-mono font-black text-purple-300">
                -฿{whtAmount.toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-white/15">
            <span className="price-total-label text-sm font-black text-white">
              {t('ยอดชำระสุทธิ (Net Total Paid):', 'Net Total Paid:')}
            </span>
            <span className="price-total-amount font-mono text-lg sm:text-xl font-black text-cyan-300">
              ฿{totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 flex items-center justify-end">
          <button
            type="button"
            onClick={handlePrintA4Invoice}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-2.5 text-xs font-black text-black hover:bg-cyan-200 shadow-lg shadow-cyan-300/20 cursor-pointer"
          >
            <Printer size={15} />
            <span>{t('พิมพ์ใบกำกับภาษี A4 / บันทึก PDF', 'Print A4 Tax Invoice / Save PDF')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
