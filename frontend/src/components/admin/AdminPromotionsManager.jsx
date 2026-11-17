import React, { useState } from 'react';
import {
  Tag,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  FileText,
  CreditCard,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const MIDTRANS_PROMO_CREATE_URL = 'https://dashboard.sandbox.midtrans.com/promo/create';
const MIDTRANS_DASHBOARD_URL = 'https://dashboard.sandbox.midtrans.com';

export default function AdminPromotionsManager() {
  const { t } = useLanguage();
  const [copiedKey, setCopiedKey] = useState('');

  const handleCopy = async (key, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 1800);
    } catch {
      /* ignore clipboard restrictions */
    }
  };

  return (
    <div className="space-y-5 w-full max-w-full overflow-x-clip">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-3xl border border-pink-400/30 bg-[#101018] p-4 sm:p-6 shadow-2xl">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-pink-400/40 bg-pink-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-pink-200">
              <Tag size={11} />
              Midtrans / VeriTrans Promo Engine
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
              ● Sandbox Connected
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white break-words">
            {t(
              'จัดการโปรโมชันและส่วนลดบน Midtrans Sandbox Dashboard',
              'Manage Promotions Directly on Midtrans Sandbox Dashboard'
            )}
          </h2>
          <p className="text-xs text-gray-400">
            {t(
              'สร้างแคมเปญส่วนลดใน Midtrans Promo Engine แล้วทดสอบกดรับสิทธิ์บนหน้า Snap Popup ได้ทันที ส่วน VAT 7% / WHT 3% และใบกำกับภาษี 13 หลักระบบคำนวณแนบให้ทุกออเดอร์อัตโนมัติ',
              'Create promos in Midtrans Promo Engine and test them directly inside the Snap Checkout popup. Thai VAT 7%, WHT 3%, and 13-digit Tax Invoices are sent automatically in item_details.'
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <a
            href={MIDTRANS_PROMO_CREATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-400 to-cyan-300 px-4 py-2.5 text-xs font-black text-black hover:brightness-110 shadow-lg shadow-pink-400/20"
          >
            <Sparkles size={15} />
            <span>{t('สร้างโปรโมชันใน Midtrans', 'Open Midtrans Promo Create')}</span>
            <ExternalLink size={14} />
          </a>

          <a
            href={MIDTRANS_DASHBOARD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-gray-200 hover:bg-white/10"
          >
            <span>{t('หน้าหลัก Sandbox', 'Sandbox Dashboard')}</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Parameter Reference Cards for Midtrans /promo/create */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-cyan-400/25 bg-[#101018] p-4 sm:p-5 space-y-3">
          <h3 className="text-sm font-black text-cyan-300 flex items-center gap-2">
            <ShieldCheck size={16} />
            <span>{t('ค่าอ้างอิงสำหรับตั้งโปรใน Midtrans Dashboard', 'Reference Values for Midtrans /promo/create')}</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400">
                  {t('รหัสสินค้าหลัก (ใช้ตั้งโปรแบบ SKU-based Promo)', 'Primary Item SKU ID (for SKU-based Promo)')}
                </p>
                <p className="font-mono font-black text-cyan-200 text-sm mt-0.5">CONCERT-TICKET</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('sku', 'CONCERT-TICKET')}
                className="shrink-0 inline-flex items-center gap-1 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-bold text-cyan-200 hover:bg-cyan-400/20 cursor-pointer"
              >
                {copiedKey === 'sku' ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedKey === 'sku' ? t('คัดลอกแล้ว', 'Copied') : t('คัดลอก', 'Copy')}</span>
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400">
                  {t('Webhook URL (ตั้งใน Settings → Configuration)', 'Webhook Notification URL')}
                </p>
                <p className="font-mono font-bold text-emerald-300 text-[11px] mt-0.5 break-all">
                  https://soundwave-pas.vercel.app/api/webhooks/veritrans
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('webhook', 'https://soundwave-pas.vercel.app/api/webhooks/veritrans')}
                className="shrink-0 inline-flex items-center gap-1 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold text-emerald-200 hover:bg-emerald-400/20 cursor-pointer"
              >
                {copiedKey === 'webhook' ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedKey === 'webhook' ? t('คัดลอกแล้ว', 'Copied') : t('คัดลอก', 'Copy')}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                <p className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                  <FileText size={12} />
                  <span>{t('ภาษีที่แนบอัตโนมัติ', 'Auto Tax Items')}</span>
                </p>
                <p className="font-mono text-[10px] text-gray-300 mt-1">
                  TAX-VAT7 (+7%)<br />
                  TAX-WHT3 (-3%)
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                <p className="text-[10px] font-bold text-pink-300 flex items-center gap-1">
                  <CreditCard size={12} />
                  <span>{t('ช่องทางใน Snap', 'Snap Channels')}</span>
                </p>
                <p className="font-mono text-[10px] text-gray-300 mt-1">
                  Credit Card · QRIS/GoPay
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step-by-Step Test Guide */}
        <div className="rounded-3xl border border-white/10 bg-[#101018] p-4 sm:p-5 space-y-3">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <QrCode size={16} className="text-emerald-300" />
            <span>{t('ขั้นตอนทดสอบโปรโมชัน Midtrans Sandbox จริง', 'How to Test Midtrans Promo Engine End-to-End')}</span>
          </h3>

          <ol className="space-y-2.5 text-xs text-gray-300">
            <li className="rounded-xl border border-white/10 bg-black/30 p-3">
              <strong className="text-cyan-300">1. {t('สร้างโปรโมชันใน Midtrans:', 'Create Promo in Midtrans:')}</strong>{' '}
              {t(
                'กดปุ่มด้านบนเพื่อเข้าหน้า /promo/create ตั้งชื่อโปร ลด % หรือจำนวนเงิน และเปิดสถานะ Active (เลือก SKU เป็น CONCERT-TICKET หรือตั้งตามวิธีชำระเงิน)',
                'Open /promo/create above, configure discount % or fixed amount, optionally target SKU CONCERT-TICKET or payment method, and set it Active.'
              )}
            </li>
            <li className="rounded-xl border border-white/10 bg-black/30 p-3">
              <strong className="text-cyan-300">2. {t('กดจองบัตรหน้าเว็บ:', 'Create Ticket Booking:')}</strong>{' '}
              {t(
                'เลือกคอนเสิร์ต ที่นั่ง และกรอกขอใบกำกับภาษี 13 หลัก (ถ้าต้องการ) ระบบจะคำนวณ VAT 7% / WHT 3% และสร้าง Snap Token ไปที่ Midtrans Sandbox',
                'Select seats and optional 13-digit Tax Invoice details. SoundWave computes VAT 7% / WHT 3% and creates a real Midtrans Sandbox Snap Token.'
              )}
            </li>
            <li className="rounded-xl border border-white/10 bg-black/30 p-3">
              <strong className="text-cyan-300">3. {t('ใช้โปรในหน้าต่าง Snap Popup:', 'Apply Promo Inside Snap Popup:')}</strong>{' '}
              {t(
                'ในหน้าชำระเงิน ให้กดปุ่ม "เปิดหน้าต่างเว็บแอปจ่ายเงิน VeriTrans/Midtrans (Snap Popup)" จะเห็นสติกเกอร์โปรโมชันที่สร้างไว้ให้กดลดราคาทันที ก่อนกดชำระเงินและรับตั๋วเข้า LINE',
                'Click "Open VeriTrans/Midtrans Snap Popup" on Checkout to see your Midtrans Dashboard promo sticker, apply the discount, and capture payment.'
              )}
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
