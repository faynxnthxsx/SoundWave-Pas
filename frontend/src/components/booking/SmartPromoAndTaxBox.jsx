import React, { useState } from 'react';
import {
  Tag,
  Sparkles,
  CheckCircle2,
  CreditCard,
  QrCode,
  FileText,
  ChevronDown,
  ChevronUp,
  Gift,
  Users,
  X,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function SmartPromoAndTaxBox({
  pricing,
  promoCodeInput,
  setPromoCodeInput,
  appliedCode,
  onApplyPromoCode,
  paymentChannel,
  setPaymentChannel,
  withholdingTax,
  setWithholdingTax,
  taxCompanyName,
  setTaxCompanyName,
  taxId,
  setTaxId,
  onQuickAddTickets,
  selectedSeatsCount = 0,
}) {
  const { t, trData } = useLanguage();
  const [showVoucherDrawer, setShowVoucherDrawer] = useState(false);
  const [showTaxForm, setShowTaxForm] = useState(true);

  if (!pricing || selectedSeatsCount === 0) return null;

  const coupons = pricing.availableCoupons || [];
  const bestCoupon = coupons.find((c) => c.isBestDeal && c.eligible);
  const cleanTaxId = String(taxId || '').replace(/\D/g, '').slice(0, 13);

  return (
    <div className="smart-promo-tax-box space-y-3 rounded-2xl border border-cyan-400/25 bg-[#101018] p-3 sm:p-3.5 shadow-xl w-full max-w-full overflow-hidden">
      {/* Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles size={15} className="text-cyan-300 shrink-0" />
          <span className="text-xs font-black text-white truncate">
            {t('โปรโมชันคอนเสิร์ต & คำนวณภาษี', 'Concert Promotions & Tax Calculation')}
          </span>
        </div>
        <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 font-mono text-[9px] font-bold text-cyan-300 border border-cyan-400/30 shrink-0">
          VeriTrans Checkout
        </span>
      </div>

      {/* ── TIER 1: AUTO SQUAD BUNDLE & UPSELL HINT ── */}
      {pricing.bundleDiscount > 0 && pricing.appliedBundlePromo && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Users size={15} className="text-emerald-300 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-emerald-200 truncate">
                🎉 {t('ได้รับโปรอัตโนมัติ:', 'Auto Bundle Applied:')} {trData(pricing.appliedBundlePromo.name)}
              </p>
              <p className="text-[10px] text-emerald-300/80 font-mono">
                {t('รหัสโปร:', 'Promo Code:')} {pricing.appliedBundlePromo.code}
              </p>
            </div>
          </div>
          <span className="font-mono text-xs font-black text-emerald-300 shrink-0">
            -฿{pricing.bundleDiscount.toLocaleString()}
          </span>
        </div>
      )}

      {pricing.upsellHint && (
        <div className="rounded-xl border border-amber-400/35 bg-amber-500/10 p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <Gift size={15} className="text-amber-300 shrink-0 mt-0.5" />
            <p className="text-[11px] font-semibold text-amber-200 leading-snug">
              {t(
                pricing.upsellHint.message,
                `Add ${pricing.upsellHint.missingTickets} more ticket(s) (total ${pricing.upsellHint.targetTickets}) to unlock "${pricing.upsellHint.code}" and save ฿${pricing.upsellHint.potentialSaving.toLocaleString()}!`
              )}
            </p>
          </div>
          {onQuickAddTickets && (
            <button
              type="button"
              onClick={() => onQuickAddTickets(pricing.upsellHint.targetTickets)}
              className="w-full sm:w-auto shrink-0 rounded-lg bg-amber-300 px-2.5 py-1.5 sm:py-1 text-[10px] font-black text-black hover:bg-amber-200 transition cursor-pointer text-center"
            >
              {t(`+ เพิ่มเป็น ${pricing.upsellHint.targetTickets} ใบ`, `+ Pick ${pricing.upsellHint.targetTickets}`)}
            </button>
          )}
        </div>
      )}

      {/* ── TIER 2: SMART VOUCHER PICKER & PROMO CODE INPUT ── */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1">
            <Tag size={12} className="text-pink-400 shrink-0" />
            {t('โค้ดส่วนลด / คูปองคอนเสิร์ต', 'Promo Code / Concert Vouchers')}
          </span>
          <button
            type="button"
            onClick={() => setShowVoucherDrawer((v) => !v)}
            className="text-[11px] font-bold text-cyan-300 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <span>
              {t(`ดูคูปองทั้งหมด (${coupons.length})`, `View All Vouchers (${coupons.length})`)}
            </span>
            {showVoucherDrawer ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* One-Click Best Deal Suggestion Banner */}
        {bestCoupon && appliedCode !== bestCoupon.code && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-pink-400/30 bg-pink-500/10 px-2.5 sm:px-3 py-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-pink-400 px-1.5 py-0.5 text-[9px] font-black text-black uppercase">
                  Best Deal ✨
                </span>
                <span className="font-mono text-xs font-black text-white">{bestCoupon.code}</span>
              </div>
              <p className="text-[10px] text-pink-200 truncate mt-0.5">
                {trData(bestCoupon.name)} ({t('ลดเพิ่ม', 'Save')} ฿{bestCoupon.estimatedSaving.toLocaleString()})
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPromoCodeInput(bestCoupon.code);
                onApplyPromoCode(bestCoupon.code);
              }}
              className="shrink-0 rounded-lg bg-pink-400 px-2.5 py-1.5 text-[10px] font-black text-black hover:bg-pink-300 transition cursor-pointer"
            >
              {t('ใช้คูปองนี้', 'Apply')}
            </button>
          </div>
        )}

        {/* Manual Code Input */}
        <div className="flex gap-1.5">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
              placeholder={t('กรอกรหัส เช่น EARLYBIRD15', 'Enter code e.g. EARLYBIRD15')}
              className="w-full rounded-xl border border-white/15 bg-[#09090f] px-3 py-2 font-mono text-xs text-white uppercase outline-none focus:border-cyan-300"
            />
            {appliedCode && (
              <button
                type="button"
                onClick={() => {
                  setPromoCodeInput('');
                  onApplyPromoCode('');
                }}
                title={t('ยกเลิกโค้ด', 'Remove code')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-400 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => onApplyPromoCode(promoCodeInput)}
            className="shrink-0 rounded-xl bg-cyan-400/20 border border-cyan-400/40 px-3 sm:px-3.5 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-400/30 transition cursor-pointer"
          >
            {t('ใช้โค้ด', 'Apply')}
          </button>
        </div>

        {pricing.couponError && (
          <p className="text-[11px] text-rose-400 flex items-center gap-1">
            <AlertCircle size={12} className="shrink-0 text-rose-400" />
            <span>{trData(pricing.couponError)}</span>
          </p>
        )}

        {pricing.appliedCouponPromo && pricing.couponDiscount > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs">
            <span className="text-cyan-200 font-semibold flex items-center gap-1 truncate">
              <CheckCircle2 size={13} className="text-cyan-300 shrink-0" />
              {t('ใช้คูปอง', 'Applied')} <strong className="font-mono">{pricing.appliedCouponPromo.code}</strong>
            </span>
            <span className="font-mono font-black text-cyan-300 shrink-0">
              -฿{pricing.couponDiscount.toLocaleString()}
            </span>
          </div>
        )}

        {/* Expandable Smart Voucher Drawer */}
        {showVoucherDrawer && (
          <div className="mt-2 space-y-2 rounded-xl border border-white/10 bg-[#12121a] p-2.5 max-h-60 overflow-y-auto">
            {coupons.length === 0 ? (
              <p className="text-center text-[11px] text-gray-500 py-2">
                {t('ไม่มีคูปองในขณะนี้', 'No vouchers available')}
              </p>
            ) : (
              coupons.map((cp) => {
                const isSelected = appliedCode === cp.code;
                const usedPct = Math.min(100, Math.round(((cp.usedCount || 0) / (cp.maxUses || 100)) * 100));
                return (
                  <div
                    key={cp.code}
                    className={`rounded-xl border p-2.5 transition ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-400/15'
                        : cp.eligible
                        ? 'border-white/10 bg-white/[0.03] hover:border-cyan-400/40'
                        : 'border-white/5 bg-white/[0.02] opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-xs font-black text-cyan-300">{cp.code}</span>
                          {cp.isBestDeal && (
                            <span className="rounded bg-pink-400 px-1.5 py-0.5 text-[9px] font-black text-black">
                              {t('คุ้มที่สุด ✨', 'Best Deal ✨')}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400">
                            ({t(`เหลือ ${cp.remainingUses} สิทธิ์`, `${cp.remainingUses} left`)})
                          </span>
                        </div>
                        <p className="text-xs font-bold text-white mt-0.5 break-words">{trData(cp.name)}</p>
                        {cp.description && (
                          <p className="text-[10px] text-gray-400 mt-0.5 break-words">{trData(cp.description)}</p>
                        )}
                        {!cp.eligible && cp.ineligibleReason && (
                          <p className="text-[10px] text-amber-300 mt-1">⚠️ {trData(cp.ineligibleReason)}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={!cp.eligible}
                        onClick={() => {
                          const next = isSelected ? '' : cp.code;
                          setPromoCodeInput(next);
                          onApplyPromoCode(next);
                        }}
                        className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-black transition cursor-pointer ${
                          isSelected
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                            : cp.eligible
                            ? 'bg-cyan-300 text-black hover:bg-cyan-200'
                            : 'bg-white/5 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {isSelected
                          ? t('ยกเลิก', 'Remove')
                          : cp.eligible
                          ? t(`ลด ฿${cp.estimatedSaving.toLocaleString()}`, `Save ฿${cp.estimatedSaving.toLocaleString()}`)
                          : t('ยังไม่เข้าเงื่อนไข', 'Not Eligible')}
                      </button>
                    </div>
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-pink-400"
                        style={{ width: `${usedPct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── TIER 3: VERITRANS PAYMENT CHANNEL & PARTNER DISCOUNT ── */}
      <div className="space-y-1.5 pt-2 border-t border-white/10">
        <span className="text-[11px] font-bold text-gray-300 block">
          {t('ช่องทางชำระเงินผ่าน VeriTrans Gateway', 'Payment Method via VeriTrans Gateway')}
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
                {t('ลดเพิ่ม 5%', '+5% Off')}
              </span>
            </div>
            <p className="text-xs font-black mt-1 truncate">{t('บัตรเครดิต / เดบิต', 'Credit / Debit Card')}</p>
            <p className="text-[9px] text-gray-400 truncate">JCB · Visa · Mastercard</p>
          </button>
        </div>

        {pricing.partnerDiscount > 0 && pricing.appliedPartnerPromo && (
          <div className="rounded-xl border border-pink-400/30 bg-pink-500/10 px-3 py-1.5 flex items-center justify-between gap-2 text-[11px]">
            <span className="text-pink-200 font-semibold truncate">
              💳 {trData(pricing.appliedPartnerPromo.name)}
            </span>
            <span className="font-mono font-black text-pink-300 shrink-0">
              -฿{pricing.partnerDiscount.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* ── CORPORATE TAX / WITHHOLDING TAX 3% TOGGLE (WITH 13-DIGIT COUNTER!) ── */}
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

      {/* ── COMPLETE PRICE, DISCOUNT & TAX BREAKDOWN TABLE (High Contrast in Light & Dark Mode) ── */}
      <div className="price-breakdown-box space-y-1.5 rounded-xl bg-[#12121a] border border-white/15 p-3 text-xs">
        <div className="price-row flex items-center justify-between gap-2">
          <span className="price-label text-gray-200 font-semibold">
            {t(`ราคาบัตรตั้งต้น (${pricing.quantity} ใบ):`, `Ticket Subtotal (${pricing.quantity}x):`)}
          </span>
          <span className="price-val font-mono font-bold text-white">
            ฿{pricing.subtotalAmount.toLocaleString()}
          </span>
        </div>

        {pricing.bundleDiscount > 0 && (
          <div className="price-row flex items-center justify-between gap-2">
            <span className="price-label-discount text-emerald-300 font-semibold truncate">
              {t('ส่วนลดแก๊งเพื่อน', 'Squad Bundle')} ({pricing.appliedBundlePromo?.code}):
            </span>
            <span className="price-val-emerald font-mono font-black text-emerald-300 shrink-0">
              -฿{pricing.bundleDiscount.toLocaleString()}
            </span>
          </div>
        )}

        {pricing.couponDiscount > 0 && (
          <div className="price-row flex items-center justify-between gap-2">
            <span className="price-label-coupon text-cyan-300 font-semibold truncate">
              {t('ส่วนลดคูปอง', 'Coupon Discount')} ({pricing.appliedCouponPromo?.code}):
            </span>
            <span className="price-val-cyan font-mono font-black text-cyan-300 shrink-0">
              -฿{pricing.couponDiscount.toLocaleString()}
            </span>
          </div>
        )}

        {pricing.partnerDiscount > 0 && (
          <div className="price-row flex items-center justify-between gap-2">
            <span className="price-label-partner text-pink-300 font-semibold truncate">
              {t('ส่วนลดพาร์ทเนอร์ VeriTrans', 'VeriTrans Partner Promo')} ({pricing.appliedPartnerPromo?.code}):
            </span>
            <span className="price-val-pink font-mono font-black text-pink-300 shrink-0">
              -฿{pricing.partnerDiscount.toLocaleString()}
            </span>
          </div>
        )}

        <div className="price-row flex items-center justify-between gap-2 pt-1.5 border-t border-white/10">
          <span className="price-label text-gray-200 font-bold">
            {t('ยอดหลังหักส่วนลด:', 'Discounted Subtotal:')}
          </span>
          <span className="price-val font-mono font-bold text-white">
            ฿{pricing.netBeforeTax.toLocaleString()}
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
              {t('ยอดชำระสุทธิ (Net Total)', 'Net Payable Amount')}
            </span>
            {pricing.discountAmount > 0 && (
              <span className="price-saved-badge text-[10px] text-emerald-400 font-extrabold block">
                {t(
                  `ประหยัดไปทั้งหมด ฿${pricing.discountAmount.toLocaleString()}!`,
                  `Total saved: ฿${pricing.discountAmount.toLocaleString()}!`
                )}
              </span>
            )}
          </div>
          <span className="price-total-amount font-mono text-lg sm:text-xl font-black text-cyan-300 shrink-0">
            ฿{pricing.totalAmount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
