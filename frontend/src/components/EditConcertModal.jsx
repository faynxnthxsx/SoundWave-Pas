import React, { useState } from 'react';
import { X, LoaderCircle, Check } from 'lucide-react';
import { useToast } from './Toast';
import ConcertDateTimePicker from './ConcertDateTimePicker';
import LocationPicker from './LocationPicker';
import { useLanguage } from '../context/LanguageContext';

export default function EditConcertModal({ concert, onClose, api, onSaveSuccess }) {
  const toast = useToast();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);

  // Format existing date to YYYY-MM-DDTHH:mm for datetime picker
  const initialDateStr = (() => {
    try {
      const d = new Date(concert.eventDate);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  })();

  const [form, setForm] = useState({
    name: concert.name || '',
    description: concert.description || '',
    eventDate: initialDateStr,
    location: concert.location || '',
    province: '',
    venue: concert.venue || '',
    latitude: concert.latitude ?? null,
    longitude: concert.longitude ?? null,
    bannerUrl: concert.bannerUrl || '',
    status: concert.status || 'ON_SALE',
  });

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t('กรุณาระบุชื่อคอนเสิร์ต', 'Please enter the concert title'));
      return;
    }
    if (!form.eventDate) {
      toast.error(t('กรุณาเลือกวันเวลาจัดแสดง', 'Please select the show date and time'));
      return;
    }
    if (!form.location.trim()) {
      toast.error(t('กรุณาระบุสถานที่จัดงาน', 'Please enter the venue location'));
      return;
    }

    setSaving(true);
    try {
      const updated = await api(`/concerts/${concert.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description,
          eventDate: new Date(form.eventDate).toISOString(),
          location: form.location.trim(),
          venue: form.venue.trim() || form.location.trim(),
          latitude: form.latitude,
          longitude: form.longitude,
          bannerUrl: form.bannerUrl,
          status: form.status,
        }),
      });

      toast.success(t(`อัปเดตข้อมูลคอนเสิร์ต "${form.name}" เรียบร้อยแล้ว`, `Updated concert "${form.name}" successfully`));
      if (onSaveSuccess) onSaveSuccess(updated);
      onClose();
    } catch (err) {
      toast.error(err.message || t('บันทึกการแก้ไขไม่สำเร็จ', 'Failed to save changes'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-md">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-concert-title"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#101019] shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-white/10 p-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">Edit Details</span>
            <h2 id="edit-concert-title" className="text-xl font-black text-white mt-0.5">
              {t('แก้ไขข้อมูลคอนเสิร์ต', 'Edit Concert')} · {concert.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('ปิด', 'Close')}
            className="rounded-xl border border-white/10 p-2 text-gray-400 hover:text-white hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-gray-300">{t('ชื่อคอนเสิร์ต *', 'Concert Title *')}</span>
            <input
              required
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#09090f] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-300"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-gray-300">{t('สถานะการจำหน่าย', 'Sales Status')}</span>
            <select
              value={form.status}
              onChange={(e) => updateField('status', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#09090f] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-300"
            >
              <option value="ON_SALE">{t('🟢 เปิดจำหน่ายบัตร (ON_SALE)', '🟢 On Sale (ON_SALE)')}</option>
              <option value="PAUSED">{t('⏸️ พักการจำหน่ายชั่วคราว (PAUSED)', '⏸️ Sales Paused (PAUSED)')}</option>
              <option value="CLOSED">{t('🔴 ปิดการจำหน่าย (CLOSED)', '🔴 Sales Closed (CLOSED)')}</option>
              <option value="UPCOMING">{t('🗓️ เร็วๆ นี้ (UPCOMING)', '🗓️ Upcoming (UPCOMING)')}</option>
              <option value="COMPLETED">{t('🏁 จัดงานเสร็จสิ้นแล้ว (COMPLETED)', '🏁 Completed (COMPLETED)')}</option>
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-gray-300">{t('คำอธิบายรายละเอียดงาน', 'Event Description')}</span>
            <textarea
              rows="3"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#09090f] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-300 resize-y"
            />
          </label>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-gray-300">{t('วันและเวลาเริ่มแสดง *', 'Show Date & Start Time *')}</span>
            <ConcertDateTimePicker
              value={form.eventDate}
              onChange={(value) => updateField('eventDate', value)}
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-gray-300">{t('สถานที่จัดงานและแผนที่ *', 'Venue Location & Map *')}</span>
            <LocationPicker
              province={form.province}
              venue={form.venue}
              location={form.location}
              latitude={form.latitude}
              longitude={form.longitude}
              onProvinceChange={(p) => updateField('province', p)}
              onVenueChange={(v) => updateField('venue', v)}
              onLocationSelect={({ location, latitude, longitude }) => {
                setForm((prev) => ({ ...prev, location, latitude, longitude }));
              }}
            />
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-gray-300">{t('URL รูปภาพโปสเตอร์งาน', 'Concert Poster Image URL')}</span>
            <input
              type="url"
              value={form.bannerUrl}
              onChange={(e) => updateField('bannerUrl', e.target.value)}
              placeholder="https://example.com/poster.jpg"
              className="w-full rounded-xl border border-white/10 bg-[#09090f] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-300"
            />
          </label>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:bg-white/5"
            >
              {t('ยกเลิก', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-300 px-5 py-2.5 text-xs font-bold text-black hover:bg-cyan-200 disabled:opacity-50 transition-all shadow-md shadow-cyan-400/20"
            >
              {saving ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />}
              <span>{saving ? t('กำลังบันทึก…', 'Saving…') : t('บันทึกการแก้ไข', 'Save Changes')}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
