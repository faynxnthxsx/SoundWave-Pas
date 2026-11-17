import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  PenLine,
  Play,
  Pause,
  Sparkles,
  RotateCcw,
  X,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Custom accessible dropdown select for the Promotion form (supports Dark & Light mode).
 */
function PromoSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const selected = options.find((opt) => opt.value === value) || options[0];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`promo-select-trigger w-full flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left text-xs transition-all cursor-pointer ${
          open
            ? 'is-open border-cyan-300 bg-[#09090f] text-white ring-2 ring-cyan-400/20'
            : 'border-white/15 bg-[#09090f] text-white hover:border-cyan-400/45'
        }`}
      >
        <span className="truncate font-semibold">{selected?.label || placeholder || '—'}</span>
        <ChevronDown
          size={15}
          className={`shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180 text-cyan-300' : 'text-gray-400'
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="promo-select-menu absolute left-0 right-0 top-full z-50 mt-1.5 rounded-2xl border border-white/15 bg-[#12121d] p-1.5 shadow-2xl max-h-60 overflow-y-auto"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`promo-select-option w-full flex items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'is-selected bg-cyan-400/15 text-cyan-200'
                    : 'text-gray-200 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-snug truncate">{opt.label}</div>
                  {opt.hint && (
                    <div className="promo-select-hint text-[10px] text-gray-400 mt-0.5 leading-snug">
                      {opt.hint}
                    </div>
                  )}
                </div>
                {isSelected && <Check size={14} className="shrink-0 text-cyan-300" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const EMPTY_PROMO_FORM = {
  code: '',
  name: '',
  description: '',
  category: 'COUPON', // COUPON | AUTO_BUNDLE | PAYMENT_PARTNER
  discountType: 'PERCENT', // PERCENT | FIXED
  discountValue: 15,
  maxDiscount: 500,
  minTickets: 1,
  minSpend: 0,
  paymentChannel: 'ALL', // ALL | CREDIT_CARD | PROMPTPAY
  concertId: '',
  maxUses: 100,
  isActive: true,
};

const QUICK_TEMPLATES = [
  {
    labelTh: '🎟️ คูปองลด 20% (สูงสุด 500฿)',
    labelEn: '🎟️ 20% Off Coupon (Max 500฿)',
    data: {
      code: 'FANS20',
      nameTh: 'คูปองลดพิเศษแฟนคลับ 20%',
      nameEn: 'Fan Club Special 20% Off Coupon',
      descriptionTh: 'ลดทันที 20% สูงสุด 500 บาท เมื่อซื้อบัตรครบ 1,500 บาท',
      descriptionEn: 'Instant 20% off up to ฿500 when spending ฿1,500+',
      category: 'COUPON',
      discountType: 'PERCENT',
      discountValue: 20,
      maxDiscount: 500,
      minTickets: 1,
      minSpend: 1500,
      paymentChannel: 'ALL',
      maxUses: 100,
    },
  },
  {
    labelTh: '👥 โปรแก๊งเพื่อน มา 4 จ่าย 3 (ลด 25%)',
    labelEn: '👥 Squad 4 Pay 3 (25% Off)',
    data: {
      code: 'GANG4',
      nameTh: 'โปรแก๊ง 4 คน ลดอัตโนมัติ 25%',
      nameEn: 'Squad of 4 Auto 25% Discount',
      descriptionTh: 'ซื้อบัตรครบ 4 ใบขึ้นไป ระบบลดให้อัตโนมัติทันที 25%',
      descriptionEn: 'Automatic 25% discount applied on orders of 4+ tickets',
      category: 'AUTO_BUNDLE',
      discountType: 'PERCENT',
      discountValue: 25,
      maxDiscount: 3000,
      minTickets: 4,
      minSpend: 0,
      paymentChannel: 'ALL',
      maxUses: 150,
    },
  },
  {
    labelTh: '💳 โปรบัตรเครดิต VeriTrans ลดเพิ่ม 8%',
    labelEn: '💳 VeriTrans Credit Card +8% Off',
    data: {
      code: 'VTCARD8',
      nameTh: 'VeriTrans Credit Card ลดเพิ่ม 8%',
      nameEn: 'VeriTrans Credit Card Extra 8% Off',
      descriptionTh: 'จ่ายผ่านบัตรเครดิต JCB / Visa / Mastercard ลดเพิ่มทันที 8% สูงสุด 400 บาท',
      descriptionEn: 'Pay with JCB / Visa / Mastercard for extra 8% off up to ฿400',
      category: 'PAYMENT_PARTNER',
      discountType: 'PERCENT',
      discountValue: 8,
      maxDiscount: 400,
      minTickets: 1,
      minSpend: 0,
      paymentChannel: 'CREDIT_CARD',
      maxUses: 500,
    },
  },
];

export default function AdminPromotionsManager({ concerts = [], api, toast, onDataChanged }) {
  const { t, trData } = useLanguage();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Create / Edit Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_PROMO_FORM);

  const loadPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const saved = JSON.parse(localStorage.getItem('soundwave_organizer') || 'null');
      const res = await fetch('/api/admin/promotions', {
        headers: saved?.sessionToken ? { Authorization: `Bearer ${saved.sessionToken}` } : {},
      });
      const json = await res.json();
      if (json.success) {
        setPromotions(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load promotions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  const handleOpenCreate = (templateData = null) => {
    setEditingId(null);
    if (templateData) {
      const { nameTh, nameEn, descriptionTh, descriptionEn, ...rest } = templateData;
      setForm({
        ...EMPTY_PROMO_FORM,
        ...rest,
        name: t(nameTh || '', nameEn || ''),
        description: t(descriptionTh || '', descriptionEn || ''),
      });
    } else {
      setForm(EMPTY_PROMO_FORM);
    }
    setShowForm(true);
  };

  const handleOpenEdit = (promo) => {
    setEditingId(promo.id);
    setForm({
      code: promo.code || '',
      name: promo.name || '',
      description: promo.description || '',
      category: promo.category || 'COUPON',
      discountType: promo.discountType || 'PERCENT',
      discountValue: promo.discountValue ?? 10,
      maxDiscount: promo.maxDiscount ?? '',
      minTickets: promo.minTickets ?? 1,
      minSpend: promo.minSpend ?? 0,
      paymentChannel: promo.paymentChannel || 'ALL',
      concertId: promo.concertId || '',
      maxUses: promo.maxUses ?? 100,
      isActive: promo.isActive !== false,
    });
    setShowForm(true);
  };

  const handleSubmitPromo = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      toast.error(t('กรุณากรอกรหัสโค้ดและชื่อโปรโมชัน', 'Please enter promo code and campaign name'));
      return;
    }
    setSaving(true);
    try {
      const path = editingId ? `/promotions/${editingId}` : '/promotions';
      const method = editingId ? 'PUT' : 'POST';
      await api(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      toast.success(
        editingId
          ? t('แก้ไขโปรโมชันสำเร็จแล้ว', 'Promotion updated successfully')
          : t('สร้างโปรโมชันใหม่สำเร็จแล้ว!', 'New promotion created!')
      );
      setShowForm(false);
      setEditingId(null);
      await loadPromotions();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      toast.error(err.message || t('บันทึกโปรโมชันไม่สำเร็จ', 'Failed to save promotion'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (promo) => {
    try {
      await api(`/promotions/${promo.id}/toggle`, { method: 'PATCH' });
      toast.success(
        `${!promo.isActive ? t('เปิดใช้งาน', 'Activated') : t('พักการใช้งาน', 'Paused')} ${promo.code}`
      );
      await loadPromotions();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      toast.error(err.message || t('เปลี่ยนสถานะไม่สำเร็จ', 'Failed to toggle status'));
    }
  };

  const handleDeletePromo = async (promo) => {
    if (
      !window.confirm(
        t(
          `ยืนยันการลบโปรโมชัน "${promo.name}" (${promo.code}) ออกจากระบบใช่หรือไม่?`,
          `Are you sure you want to delete promotion "${promo.name}" (${promo.code})?`
        )
      )
    ) {
      return;
    }
    try {
      await api(`/promotions/${promo.id}`, { method: 'DELETE' });
      toast.success(t(`ลบโปรโมชัน ${promo.code} เรียบร้อยแล้ว`, `Deleted promotion ${promo.code}`));
      await loadPromotions();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      toast.error(err.message || t('ลบโปรโมชันไม่สำเร็จ', 'Failed to delete promotion'));
    }
  };

  const handleRestoreDefaults = async () => {
    try {
      await api('/promotions/reset-defaults', { method: 'POST' });
      toast.success(
        t('กู้คืนชุดโปรโมชันมาตรฐานสำหรับคอนเสิร์ตเรียบร้อยแล้ว!', 'Default concert promotions restored!')
      );
      await loadPromotions();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      toast.error(err.message || t('กู้คืนโปรโมชันไม่สำเร็จ', 'Failed to restore promotions'));
    }
  };

  const categoryBadge = (cat) => {
    if (cat === 'AUTO_BUNDLE') {
      return (
        <span className="rounded-full bg-emerald-400/15 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
          👥 {t('โปรแก๊งเพื่อนอัตโนมัติ', 'Auto Squad Bundle')}
        </span>
      );
    }
    if (cat === 'PAYMENT_PARTNER') {
      return (
        <span className="rounded-full bg-pink-400/15 border border-pink-400/30 px-2.5 py-0.5 text-[10px] font-bold text-pink-300">
          💳 {t('โปรพาร์ทเนอร์ VeriTrans', 'VeriTrans Partner Promo')}
        </span>
      );
    }
    return (
      <span className="rounded-full bg-cyan-400/15 border border-cyan-400/30 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
        🎟️ {t('โค้ดคูปองส่วนลด', 'Promo Coupon Code')}
      </span>
    );
  };

  return (
    <div className="space-y-5 w-full max-w-full overflow-x-clip">
      {/* ── 1. PROMOTIONS & DISCOUNTS HEADER + ACTIONS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <Tag size={20} className="text-cyan-300 shrink-0" />
            <span className="break-words">
              {t(
                `จัดการโปรโมชัน โค้ดส่วนลด และแคมเปญคอนเสิร์ต (${promotions.length} รายการ)`,
                `Manage Concert Promotions & Discount Codes (${promotions.length} items)`
              )}
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {t(
              'แอดมินสามารถสร้างโปรโมชันใหม่ แก้ไขเงื่อนไข เปิด/ปิดชั่วคราว หรือลบโปรโมชันออกได้ทันที',
              'Create new promotions, edit rules, pause/resume, or delete promotions in real time.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>{t('กู้คืนโปรตัวอย่าง', 'Restore Defaults')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenCreate()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-cyan-300 px-4 py-2 text-xs font-black text-black hover:bg-cyan-200 shadow-lg shadow-cyan-300/20 cursor-pointer"
          >
            <Plus size={15} />
            <span>{t('+ เพิ่มโปรโมชันใหม่', '+ New Promotion')}</span>
          </button>
        </div>
      </div>

      {/* 1-Click Quick Templates Bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
        <span className="text-xs font-bold text-gray-400 flex items-center gap-1 w-full sm:w-auto">
          <Sparkles size={13} className="text-amber-300 shrink-0" />
          {t('สร้างด่วนใน 1 คลิก:', '1-Click Templates:')}
        </span>
        {QUICK_TEMPLATES.map((tpl) => (
          <button
            key={tpl.data.code}
            type="button"
            onClick={() => handleOpenCreate(tpl.data)}
            className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-[11px] sm:text-xs font-bold text-cyan-200 hover:bg-cyan-400/20 transition cursor-pointer"
          >
            {t(tpl.labelTh, tpl.labelEn)}
          </button>
        ))}
      </div>

      {/* ── 2. CREATE / EDIT PROMOTION FORM MODAL/CARD ── */}
      {showForm && (
        <form
          onSubmit={handleSubmitPromo}
          className="rounded-3xl border border-cyan-400/40 bg-[#101018] p-4 sm:p-6 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm sm:text-base font-black text-white">
              {editingId
                ? t(`✏️ แก้ไขโปรโมชัน (${form.code})`, `✏️ Edit Promotion (${form.code})`)
                : t('✨ สร้างโปรโมชัน / โค้ดส่วนลดใหม่', '✨ Create New Promotion / Discount Code')}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-1 text-gray-400 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block space-y-1">
              <span className="text-xs font-bold text-gray-300">
                {t('รหัสโค้ด (Promo Code) *', 'Promo Code *')}
              </span>
              <input
                required
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="SUMMER20"
                className="w-full rounded-xl border border-white/15 bg-[#09090f] px-3.5 py-2.5 font-mono text-xs text-white uppercase outline-none focus:border-cyan-300"
              />
            </label>

            <label className="block space-y-1 sm:col-span-2">
              <span className="text-xs font-bold text-gray-300">
                {t('ชื่อแคมเปญ / โปรโมชัน *', 'Campaign / Promotion Name *')}
              </span>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('เช่น โปรแก๊งเพื่อน มา 4 จ่าย 3', 'e.g. Squad 4 Pay 3 Bundle')}
                className="w-full rounded-xl border border-white/15 bg-[#09090f] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-300"
              />
            </label>

            <div className="space-y-1">
              <span className="block text-xs font-bold text-gray-300">
                {t('ประเภทโปรโมชัน', 'Promotion Category')}
              </span>
              <PromoSelect
                value={form.category}
                onChange={(val) => setForm({ ...form, category: val })}
                options={[
                  {
                    value: 'COUPON',
                    label: t('🎟️ โค้ดคูปองส่วนลด', '🎟️ Promo Coupon Code'),
                    hint: t('ลูกค้ากรอกโค้ดหรือเลือกใช้จากคลังคูปอง', 'Customer applies manually or picks from drawer'),
                  },
                  {
                    value: 'AUTO_BUNDLE',
                    label: t('👥 โปรแก๊งเพื่อน (Auto Bundle)', '👥 Squad Bundle (Auto)'),
                    hint: t('ลดอัตโนมัติทันทีตามจำนวนบัตรที่ซื้อ', 'Applied automatically based on ticket quantity'),
                  },
                  {
                    value: 'PAYMENT_PARTNER',
                    label: t('💳 โปรพาร์ทเนอร์ VeriTrans', '💳 VeriTrans Partner Promo'),
                    hint: t('ลดเพิ่มตามช่องทางชำระเงินที่กำหนด', 'Discount triggered by selected payment method'),
                  },
                ]}
              />
            </div>

            <div className="space-y-1">
              <span className="block text-xs font-bold text-gray-300">
                {t('รูปแบบการลดราคา', 'Discount Type')}
              </span>
              <PromoSelect
                value={form.discountType}
                onChange={(val) => setForm({ ...form, discountType: val })}
                options={[
                  {
                    value: 'PERCENT',
                    label: t('💯 ลดเป็นเปอร์เซ็นต์ (%)', '💯 Percentage (%)'),
                    hint: t('คำนวณ % จากยอดรวม พร้อมเพดานลดสูงสุด', 'Percent off subtotal with optional max cap'),
                  },
                  {
                    value: 'FIXED',
                    label: t('💵 ลดเป็นจำนวนเงินคงที่ (บาท)', '💵 Fixed Amount (THB)'),
                    hint: t('หักลบจำนวนเงินคงที่ต่อคำสั่งซื้อ', 'Flat THB discount per booking order'),
                  },
                ]}
              />
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-bold text-gray-300">
                {t(
                  `มูลค่าส่วนลด (${form.discountType === 'PERCENT' ? '%' : 'บาท'}) *`,
                  `Discount Value (${form.discountType === 'PERCENT' ? '%' : 'THB'}) *`
                )}
              </span>
              <input
                required
                type="number"
                min="1"
                max={form.discountType === 'PERCENT' ? 100 : 100000}
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-[#09090f] px-3.5 py-2.5 font-mono text-xs text-white outline-none focus:border-cyan-300"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold text-gray-300">
                {t('ลดสูงสุดไม่เกิน (บาท)', 'Max Discount Cap (THB)')}
              </span>
              <input
                type="number"
                min="0"
                value={form.maxDiscount}
                onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                placeholder={t('เว้นว่าง = ไม่จำกัดเพดาน', 'Blank = No limit')}
                className="w-full rounded-xl border border-white/15 bg-[#09090f] px-3.5 py-2.5 font-mono text-xs text-white outline-none focus:border-cyan-300"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold text-gray-300">
                {t('จำนวนบัตรขั้นต่ำ (ใบ)', 'Min Tickets')}
              </span>
              <input
                type="number"
                min="1"
                max="6"
                value={form.minTickets}
                onChange={(e) => setForm({ ...form, minTickets: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-[#09090f] px-3.5 py-2.5 font-mono text-xs text-white outline-none focus:border-cyan-300"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold text-gray-300">
                {t('ยอดซื้อขั้นต่ำ (บาท)', 'Min Spend (THB)')}
              </span>
              <input
                type="number"
                min="0"
                value={form.minSpend}
                onChange={(e) => setForm({ ...form, minSpend: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-[#09090f] px-3.5 py-2.5 font-mono text-xs text-white outline-none focus:border-cyan-300"
              />
            </label>

            <div className="space-y-1">
              <span className="block text-xs font-bold text-gray-300">
                {t('ช่องทางชำระเงินที่ร่วมรายการ', 'Eligible Payment Channel')}
              </span>
              <PromoSelect
                value={form.paymentChannel}
                onChange={(val) => setForm({ ...form, paymentChannel: val })}
                options={[
                  {
                    value: 'ALL',
                    label: t('✨ ทุกช่องทาง (PromptPay & บัตรเครดิต)', '✨ All Payment Channels'),
                    hint: t('ใช้ได้ทั้ง QR PromptPay และบัตรเครดิต/เดบิต', 'Valid for PromptPay and Credit/Debit Card'),
                  },
                  {
                    value: 'CREDIT_CARD',
                    label: t('💳 เฉพาะบัตรเครดิต/เดบิต', '💳 Credit / Debit Card Only'),
                    hint: t('รองรับบัตร JCB / Visa / Mastercard', 'Supports JCB / Visa / Mastercard'),
                  },
                  {
                    value: 'PROMPTPAY',
                    label: t('📱 เฉพาะ QR PromptPay', '📱 QR PromptPay Only'),
                    hint: t('เฉพาะการสแกนจ่ายผ่านพร้อมเพย์', 'Valid exclusively for QR PromptPay'),
                  },
                ]}
              />
            </div>

            <div className="space-y-1">
              <span className="block text-xs font-bold text-gray-300">
                {t('คอนเสิร์ตที่ร่วมรายการ', 'Applicable Concert')}
              </span>
              <PromoSelect
                value={form.concertId}
                onChange={(val) => setForm({ ...form, concertId: val })}
                options={[
                  {
                    value: '',
                    label: t('🎵 ทุกคอนเสิร์ตในระบบ', '🎵 All Concerts'),
                    hint: t('ใช้ส่วนลดได้กับทุกงานที่เปิดขาย', 'Applicable to all active concerts'),
                  },
                  ...concerts.map((c) => ({
                    value: c.id,
                    label: trData(c.name),
                    hint: trData(c.location || ''),
                  })),
                ]}
              />
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-bold text-gray-300">
                {t('จำนวนสิทธิ์ทั้งหมด (Quota)', 'Total Quota Limit')}
              </span>
              <input
                type="number"
                min="1"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-[#09090f] px-3.5 py-2.5 font-mono text-xs text-white outline-none focus:border-cyan-300"
              />
            </label>

            <label className="block space-y-1 sm:col-span-2 lg:col-span-3">
              <span className="text-xs font-bold text-gray-300">
                {t('รายละเอียดเงื่อนไข (แสดงให้ลูกค้าเห็นในหน้าเลือกคูปอง)', 'Description / Terms')}
              </span>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t(
                  'เช่น ซื้อครบ 4 ใบ ลดทันที 25% หรือ ลดพิเศษสำหรับผู้ถือบัตรเครดิต JCB',
                  'e.g. Buy 4 tickets get 25% off automatically'
                )}
                className="w-full rounded-xl border border-white/15 bg-[#09090f] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-300"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-white/5 cursor-pointer"
            >
              {t('ยกเลิก', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-cyan-300 px-5 py-2 text-xs font-black text-black hover:bg-cyan-200 disabled:opacity-50 cursor-pointer"
            >
              {saving
                ? t('กำลังบันทึก...', 'Saving...')
                : editingId
                ? t('บันทึกการแก้ไข', 'Save Changes')
                : t('สร้างโปรโมชันทันที', 'Create Promotion')}
            </button>
          </div>
        </form>
      )}

      {/* ── 3. PROMOTIONS LIST GRID (WITH EDIT, TOGGLE & DELETE) ── */}
      {loading ? (
        <div className="py-12 text-center text-xs text-gray-400">
          {t('กำลังโหลดข้อมูลโปรโมชัน...', 'Loading promotions...')}
        </div>
      ) : promotions.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#101018] p-8 sm:p-10 text-center space-y-3">
          <p className="text-sm font-bold text-white">
            {t('ยังไม่มีโปรโมชันในระบบ', 'No promotions in the system')}
          </p>
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="rounded-xl bg-cyan-300 px-4 py-2 text-xs font-black text-black hover:bg-cyan-200 cursor-pointer"
          >
            {t('+ โหลดโปรโมชันตัวอย่างสำหรับคอนเสิร์ต', '+ Load Default Concert Promotions')}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promotions.map((promo) => {
            const used = promo.usedCount || 0;
            const max = promo.maxUses || 100;
            const pct = Math.min(100, Math.round((used / max) * 100));

            return (
              <article
                key={promo.id}
                className={`rounded-3xl border p-4 sm:p-5 shadow-xl transition flex flex-col justify-between min-w-0 ${
                  promo.isActive
                    ? 'border-white/10 bg-[#101018] hover:border-cyan-400/35'
                    : 'border-white/5 bg-[#101018] opacity-65'
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    {categoryBadge(promo.category)}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        promo.isActive
                          ? 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/30'
                          : 'bg-gray-500/20 text-gray-400 border border-white/10'
                      }`}
                    >
                      {promo.isActive ? t('● เปิดใช้งาน', '● Active') : t('⏸ พักชั่วคราว', '⏸ Paused')}
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-base sm:text-lg font-black text-cyan-300 truncate">{promo.code}</span>
                    <span className="font-mono text-sm sm:text-base font-black text-white shrink-0">
                      {promo.discountType === 'PERCENT'
                        ? t(`ลด ${promo.discountValue}%`, `${promo.discountValue}% Off`)
                        : t(
                            `ลด ฿${Number(promo.discountValue).toLocaleString()}`,
                            `฿${Number(promo.discountValue).toLocaleString()} Off`
                          )}
                    </span>
                  </div>

                  <h3 className="mt-1 text-sm font-black text-white break-words">{trData(promo.name)}</h3>
                  <p className="mt-1 text-xs text-gray-400 line-clamp-2 break-words">
                    {trData(promo.description) || t('ไม่มีคำอธิบายเพิ่มเติม', 'No additional description')}
                  </p>

                  {/* Conditions pills */}
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                    {promo.minTickets > 1 && (
                      <span className="rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-gray-300">
                        {t(`ขั้นต่ำ ${promo.minTickets} ใบ`, `Min ${promo.minTickets} tickets`)}
                      </span>
                    )}
                    {promo.minSpend > 0 && (
                      <span className="rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-gray-300">
                        {t(
                          `ซื้อขั้นต่ำ ฿${Number(promo.minSpend).toLocaleString()}`,
                          `Min spend ฿${Number(promo.minSpend).toLocaleString()}`
                        )}
                      </span>
                    )}
                    {promo.maxDiscount > 0 && (
                      <span className="rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-gray-300">
                        {t(
                          `ลดสูงสุด ฿${Number(promo.maxDiscount).toLocaleString()}`,
                          `Max ฿${Number(promo.maxDiscount).toLocaleString()}`
                        )}
                      </span>
                    )}
                    {promo.paymentChannel && promo.paymentChannel !== 'ALL' && (
                      <span className="rounded-lg bg-pink-500/15 border border-pink-400/30 px-2 py-0.5 text-pink-200 font-bold">
                        {t('ช่องทาง:', 'Channel:')} {promo.paymentChannel}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 space-y-3">
                  {/* Quota Progress Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-gray-400">{t('จำนวนสิทธิ์ที่ใช้ไป:', 'Quota Used:')}</span>
                      <span className="font-mono font-bold text-white">
                        {used} / {max} {t('สิทธิ์', 'uses')} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-pink-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons: Toggle, Edit, Delete */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(promo)}
                      className={`flex-1 flex items-center justify-center gap-1 rounded-xl border py-1.5 text-[11px] font-bold transition cursor-pointer ${
                        promo.isActive
                          ? 'border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20'
                          : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20'
                      }`}
                    >
                      {promo.isActive ? <Pause size={12} /> : <Play size={12} />}
                      <span>{promo.isActive ? t('พักโปร', 'Pause') : t('เปิดใช้', 'Activate')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(promo)}
                      className="flex items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-gray-200 hover:bg-white/10 cursor-pointer"
                    >
                      <PenLine size={12} />
                      <span>{t('แก้ไข', 'Edit')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeletePromo(promo)}
                      title={t('ลบโปรโมชันนี้', 'Delete Promotion')}
                      className="flex items-center justify-center gap-1 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-[11px] font-bold text-rose-300 hover:bg-rose-500/25 cursor-pointer"
                    >
                      <Trash2 size={12} />
                      <span>{t('ลบ', 'Delete')}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
