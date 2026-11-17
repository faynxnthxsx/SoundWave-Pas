import React, { useState } from 'react';
import {
  Sparkles,
  CreditCard,
  QrCode,
  FileText,
  Tag,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function SmartPromoAndTaxBox({
  pricing,
  paymentChannel,
  setPaymentChannel,
  withholdingTax,
  setWithholdingTax,
  taxCompanyName,
  setTaxCompanyName,
  taxId,
  setTaxId,
  selectedSeatsCount = 0,
}) {
  const { t } = useLanguage();
  const [showTaxForm, setShowTaxForm] = useState(true);

  if (!pricing || selectedSeatsCount === 0) return null;

  const cleanTaxId = String(taxId || '').replace(/\D/g, '').slice(0, 13);

  return (
    <div className="smart-promo-tax-box space-y-3 rounded-2xl border border-cyan-400/25 bg-[#101018] p-3 sm:p-3.5 shadow-xl w-full max-w-full overflow-hidden">
      {/* Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles size={15} className="text-cyan-300 shrink-0" />
          <span className="text-xs font-black text-white truncate">
            {t('คำนวณภาษี & ช่องทางชำระเงิน VeriTrans', 'Tax Engine & VeriTrans Checkout')}
          </span>
        </div>
        <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 font-mono text-[9px] font-bold text-cyan-300 border border-cyan-400/30 shrink-0">
          Midtrans Promo Ready
        </span>
      </div>

      {/* Midtrans Promo Engine Notice */}
      <div className="rounded-xl border border-pink-400/30 bg-pink-500/10 p-2.5 flex items-start gap-2 text-[11px]">
        <Tag size={14} className="text-pink-300 shrink-0 mt-0.5" />
        <p className="text-pink-100 leading-snug">
          {t(
            'โปรโมชันและโค้ดส่วนลดเชื่อมกับ Midtrans Promo Engine — เมื่อกดเปิดหน้าต่างชำระเงิน Snap ระบบจะแสดงโปรโมชันให้เลือกใช้ทันที (SKU: CONCERT-TICKET)',
            'Promotions & vouchers run on Midtrans Promo Engine — open Snap Checkout on the next step to view & apply active promos (SKU: CONCERT-TICKET).'
          )}
        </p>
      </div>

      {/* Payment Channel Selector */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[11px] font-bold text-gray-300 block">
          {t('ช่องทางชำระเงินผ่าน VeriTrans / Midtrans', 'Payment Method via VeriTrans / Midtrans')}
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPaymentChannel('PROMPTPAY')}
            className={`rounded-xl border p-2 sm:p-2.5 text-left transition cursor-pointer min-w-0 ${
              paymentChannel === 'PROMPTPAY'
                ? 'border-cyan-400 bg-cyan-400/15 text-white'
                : 'border-white/10 bg-white/[0.02] text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <QrCode size={15} className="text-cyan-300 shrink-0" />
              <span className="text-[9px] font-bold text-emerald-300 truncate">
                {t('ฟรีค่าธรรมเนียม', '0% Fee')}
              </span>
            </div>
            <p className="text-xs font-black mt-1 truncate">QR PromptPay</p>
            <p className="text-[9px] text-gray-400 truncate">{t('สแกนจ่ายทุกธนาคาร', 'Scan via Mobile Banking')}</p>
          </button>

          <button
            type="button"
            onClick={() => setPaymentChannel('CREDIT_CARD')}
            className={`rounded-xl border p-2 sm:p-2.5 text-left transition cursor-pointer min-w-0 ${
              paymentChannel !== 'PROMPTPAY'
                ? 'border-pink-400 bg-pink-500/15 text-white'
                : 'border-white/10 bg-white/[0.02] text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <CreditCard size={15} className="text-pink-300 shrink-0" />
              <span className="rounded bg-pink-400/20 border border-pink-400/40 px-1.5 py-0.2 text-[9px] font-black text-pink-200 shrink-0">
                Midtrans Promo
              </span>
            </div>
            <p className="text-xs font-black mt-1 truncate">{t('บัตรเครดิต / เดบิต', 'Credit / Debit Card')}</p>
            <p className="text-[9px] text-gray-400 truncate">JCB · Visa · Mastercard</p>
          </button>
        </div>
      </div>

      {/* Corporate Tax / Withholding Tax 3% Toggle (With 13-digit Counter) */}
      <div className="pt-2 border-t border-white/10">
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-[11px] text-gray-300 cursor-pointer select-none min-w-0">
            <input
              type="checkbox"
              checked={withholdingTax}
              onChange={(e) => {
                setWithholdingTax(e.target.checked);
                if (e.target.checked) setShowTaxForm(true);
              }}
              className="rounded border-white/20 bg-black text-cyan-400 focus:ring-0 shrink-0"
            />
            <FileText size={13} className="text-cyan-300 shrink-0" />
            <span className="truncate">
              {t('ขอใบกำกับภาษี / หักภาษี ณ ที่จ่าย (WHT 3%)', 'Request Tax Invoice / Withholding Tax (WHT 3%)')}
            </span>
          </label>
          {withholdingTax && (
            <button
              type="button"
              onClick={() => setShowTaxForm((v) => !v)}
              className="text-[10px] text-cyan-300 underline cursor-pointer shrink-0"
            >
              {showTaxForm ? t('ซ่อน', 'Hide') : t('กรอกข้อมูลภาษี', 'Tax Details')}
            </button>
          )}
        </div>

        {withholdingTax && showTaxForm && (
          <div className="mt-2 space-y-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <div>
              <span className="text-[10px] text-gray-400 block mb-1">
                {t('ชื่อบริษัท / นิติบุคคล', 'Company / Legal Entity Name')}
              </span>
              <input
                type="text"
                value={taxCompanyName}
                onChange={(e) => setTaxCompanyName(e.target.value)}
                placeholder={t('เช่น บริษัท ซาวด์เวฟ เอ็นเตอร์เทนเมนท์ จำกัด', 'e.g. SoundWave Entertainment Co., Ltd.')}
                className="w-full rounded-lg border border-white/10 bg-[#09090f] px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-300"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-400">
                  {t('เลขประจำตัวผู้เสียภาษี (13 หลัก)', 'Tax ID (13 digits)')}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold ${
                    cleanTaxId.length === 13 ? 'text-emerald-400' : 'text-cyan-300'
                  }`}
                >
                  {cleanTaxId.length === 13
                    ? t('✓ ครบ 13 หลัก (13/13)', '✓ 13/13 digits')
                    : `${cleanTaxId.length}/13 ${t('หลัก', 'digits')}`}
                </span>
              </div>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={13}
                value={cleanTaxId}
                onChange={(e) => setTaxId(e.target.value.replace(/\D/g, '').slice(0, 13))}
                placeholder="0105560012345"
                className={`w-full rounded-lg border bg-[#09090f] px-2.5 py-1.5 font-mono text-xs text-white outline-none transition ${
                  cleanTaxId.length === 13 ? 'border-emerald-400/60' : 'border-white/10 focus:border-cyan-300'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Price & Tax Breakdown Table */}
      <div className="price-breakdown-box space-y-1.5 rounded-xl bg-[#12121a] border border-white/15 p-3 text-xs">
        <div className="price-row flex items-center justify-between gap-2">
          <span className="price-label text-gray-200 font-semibold">
            {t(`ราคาบัตรตั้งต้น (${pricing.quantity} ใบ):`, `Ticket Subtotal (${pricing.quantity}x):`)}
          </span>
          <span className="price-val font-mono font-bold text-white">
            ฿{pricing.subtotalAmount.toLocaleString()}
          </span>
        </div>

        <div className="price-row flex items-center justify-between gap-2">
          <span className="price-label-vat text-amber-300 font-semibold">
            {t('ภาษีมูลค่าเพิ่ม (VAT 7%):', 'Value Added Tax (VAT 7%):')}
          </span>
          <span className="price-val-amber font-mono font-bold text-amber-300 shrink-0">
            +฿{pricing.vatAmount.toLocaleString()}
          </span>
        </div>

        {pricing.whtAmount > 0 && (
          <div className="price-row flex items-center justify-between gap-2">
            <span className="price-label-wht text-purple-300 font-semibold">
              {t('หักภาษี ณ ที่จ่าย (WHT 3%):', 'Withholding Tax (WHT 3%):')}
            </span>
            <span className="price-val-purple font-mono font-black text-purple-300 shrink-0">
              -฿{pricing.whtAmount.toLocaleString()}
            </span>
          </div>
        )}

        <div className="price-total-row flex items-center justify-between gap-2 pt-2 border-t border-white/15">
          <div className="min-w-0">
            <span className="price-total-label font-black text-white text-xs sm:text-sm block">
              {t('ยอดรวมก่อนโปรโมชัน Midtrans', 'Total (Before Midtrans Promo)')}
            </span>
            <span className="text-[10px] text-cyan-300 block">
              {t('เลือกใช้ส่วนลดเพิ่มได้ในหน้าต่าง Snap Sandbox', 'Apply dashboard promos in Snap Sandbox popup')}
            </span>
          </div>
          <span className="price-total-amount font-mono text-lg sm:text-xl font-black text-cyan-300 shrink-0">
            ฿{pricing.totalAmount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
