import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, LoaderCircle, MapPin, Minus, Plus, Ticket, UserRound } from 'lucide-react';
import StadiumZoneMap from './StadiumZoneMap';

export default function ZoneSelectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const concertId = searchParams.get('concertId');
  const bookingDraftKey = `soundwave_booking_draft:${concertId || 'default'}`;
  const [bookingDraft] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(bookingDraftKey) || 'null'); }
    catch { return null; }
  });
  const [concert, setConcert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedZone, setSelectedZone] = useState(null);
  const [quantity, setQuantity] = useState(() => Math.max(1, Number(bookingDraft?.quantity) || 1));
  const [customerName, setCustomerName] = useState(() => bookingDraft?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(() => bookingDraft?.customerPhone || '');
  const [customerLineId, setCustomerLineId] = useState('');
  const [lineUser, setLineUser] = useState(null);
  const [officialAccountUrl, setOfficialAccountUrl] = useState(() => localStorage.getItem('soundwave_line_bot_url') || '');
  const [lineLoading, setLineLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await fetch(concertId ? `/api/concerts/${encodeURIComponent(concertId)}` : '/api/concerts');
        const data = await response.json();
        const event = concertId ? data.data : data.data?.[0];
        if (!response.ok || !data.success || !event) throw new Error(data.message || 'ไม่พบคอนเสิร์ตที่เลือก');
        if (!mounted) return;
        setConcert(event);
        const availableZones = event.zones?.filter((zone) => zone.available > 0) || [];
        const zoneToSelect = availableZones.find((zone) => zone.id === bookingDraft?.zoneId) || availableZones[0] || null;
        setSelectedZone(zoneToSelect);
        if (zoneToSelect) setQuantity(Math.min(Math.max(1, Number(bookingDraft?.quantity) || 1), 6, zoneToSelect.available));
      } catch (err) {
        if (mounted) setLoadError(err.message || 'โหลดข้อมูลคอนเสิร์ตไม่สำเร็จ');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();

    try {
      const account = JSON.parse(localStorage.getItem('soundwave_user') || 'null');
      if (account) {
        if (!bookingDraft?.customerName) setCustomerName(account.username || '');
        setCustomerLineId(account.lineUserId || '');
      }
      const savedLine = JSON.parse(localStorage.getItem('soundwave_line_user') || 'null');
      if (savedLine) {
        setLineUser(savedLine);
        if (!bookingDraft?.customerName) setCustomerName(savedLine.displayName || account?.username || '');
        setCustomerLineId(savedLine.userId || account?.lineUserId || '');
      }
    } catch { /* Ignore malformed saved profile data. */ }

    fetch('/api/auth/line/config').then((response) => response.json()).then((config) => {
      if (config.officialAccountUrl) {
        setOfficialAccountUrl(config.officialAccountUrl);
        localStorage.setItem('soundwave_line_bot_url', config.officialAccountUrl);
      }
    }).catch(() => {});

    const callbackParams = new URLSearchParams(window.location.search);
    const code = callbackParams.get('code');
    const oauthError = callbackParams.get('error');
    if (oauthError) {
      const reason = callbackParams.get('error_description') || oauthError;
      setErrorMsg(`LINE Login ไม่สำเร็จ: ${reason}`);
      sessionStorage.removeItem('soundwave_line_state');
      sessionStorage.removeItem('soundwave_line_return_to');
      callbackParams.delete('error');
      callbackParams.delete('error_description');
      callbackParams.delete('state');
      window.history.replaceState({}, document.title, `${window.location.pathname}${callbackParams.toString() ? `?${callbackParams}` : ''}`);
    }
    if (code) {
      if (sessionStorage.getItem('soundwave_line_callback_code') === code) {
        return () => { mounted = false; };
      }
      const receivedState = callbackParams.get('state');
      const expectedState = sessionStorage.getItem('soundwave_line_state');
      if (!expectedState || receivedState !== expectedState) {
        sessionStorage.removeItem('soundwave_line_state');
        setErrorMsg('ยืนยันการเชื่อมต่อ LINE ไม่สำเร็จ กรุณากดเชื่อมต่ออีกครั้ง');
        callbackParams.delete('code');
        callbackParams.delete('state');
        window.history.replaceState({}, document.title, `${window.location.pathname}${callbackParams.toString() ? `?${callbackParams}` : ''}`);
        return () => { mounted = false; };
      }
      sessionStorage.setItem('soundwave_line_callback_code', code);
      sessionStorage.removeItem('soundwave_line_state');
      setLineLoading(true);
      fetch('/api/auth/line/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (!data.success || !data.user) throw new Error(data.message || 'เชื่อมต่อ LINE ไม่สำเร็จ');
          const linkedUser = {
            ...data.user,
            friendFlag: typeof data.user.friendFlag === 'boolean'
              ? data.user.friendFlag
              : callbackParams.get('friendship_status_changed') === 'true' ? true : null,
          };
          localStorage.setItem('soundwave_line_user', JSON.stringify(linkedUser));
          sessionStorage.removeItem('soundwave_line_callback_code');
          setLineUser(linkedUser);
          setCustomerName(linkedUser.displayName || '');
          setCustomerLineId(linkedUser.userId || '');
          const returnTo = sessionStorage.getItem('soundwave_line_return_to');
          sessionStorage.removeItem('soundwave_line_return_to');
          if (returnTo) window.location.replace(returnTo);
          else {
            const cleaned = new URL(window.location.href);
            cleaned.searchParams.delete('code');
            cleaned.searchParams.delete('state');
            cleaned.searchParams.delete('friendship_status_changed');
            window.history.replaceState({}, document.title, `${cleaned.pathname}${cleaned.search}`);
          }
        })
        .catch((err) => {
          sessionStorage.removeItem('soundwave_line_callback_code');
          setErrorMsg(err.message || 'เชื่อมต่อ LINE ไม่สำเร็จ');
          sessionStorage.removeItem('soundwave_line_return_to');
          callbackParams.delete('code');
          callbackParams.delete('state');
          window.history.replaceState({}, document.title, `${window.location.pathname}${callbackParams.toString() ? `?${callbackParams}` : ''}`);
        })
        .finally(() => setLineLoading(false));
    }
    return () => { mounted = false; };
  }, [concertId]);

  useEffect(() => {
    if (!concert || loading) return;
    sessionStorage.setItem(bookingDraftKey, JSON.stringify({
      concertId: concert.id,
      zoneId: selectedZone?.id || null,
      quantity,
      customerName,
      customerPhone,
    }));
  }, [bookingDraftKey, concert, customerName, customerPhone, loading, quantity, selectedZone]);

  const available = selectedZone?.available || 0;
  const maxQuantity = Math.min(6, available);
  const totalPrice = useMemo(() => selectedZone ? selectedZone.price * quantity : 0, [selectedZone, quantity]);

  const selectZone = (zone) => {
    if (zone.available <= 0) return;
    setSelectedZone(zone);
    setQuantity(1);
    setErrorMsg('');
  };

  const handleLineLogin = async () => {
    setLineLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/auth/line/config');
      const config = await response.json();
      if (!response.ok || !config.channelId || !config.callbackUrl) throw new Error('ตั้งค่า LINE Login ไม่ครบ');
      if (config.officialAccountUrl) {
        setOfficialAccountUrl(config.officialAccountUrl);
        localStorage.setItem('soundwave_line_bot_url', config.officialAccountUrl);
      }
      const state = globalThis.crypto?.randomUUID?.().replace(/-/g, '') || `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(bookingDraftKey, JSON.stringify({
        concertId: concert?.id || concertId,
        zoneId: selectedZone?.id || null,
        quantity,
        customerName,
        customerPhone,
      }));
      sessionStorage.setItem('soundwave_line_state', state);
      sessionStorage.setItem('soundwave_line_return_to', window.location.href);
      const query = new URLSearchParams({ response_type: 'code', client_id: config.channelId, redirect_uri: config.callbackUrl, state, scope: 'profile openid', prompt: 'consent', bot_prompt: 'aggressive' });
      window.location.assign(`https://access.line.me/oauth2/v2.1/authorize?${query.toString()}`);
    } catch (err) {
      setErrorMsg(err.message || 'เริ่ม LINE Login ไม่สำเร็จ');
      setLineLoading(false);
    }
  };

  const handleBookingSubmit = async (event) => {
    event.preventDefault();
    if (!selectedZone || maxQuantity < 1) return;
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('กรอกชื่อผู้ซื้อและเบอร์โทรศัพท์ให้ครบก่อนจอง');
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > maxQuantity) {
      setErrorMsg('จำนวนบัตรเกินสต็อกที่เหลือ กรุณาเลือกจำนวนใหม่');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concertId: concert.id,
          zoneId: selectedZone.id,
          quantity,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerLineId: customerLineId.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'จองบัตรไม่สำเร็จ');
      sessionStorage.removeItem(bookingDraftKey);
      navigate(`/booking/payment/${data.data.bookingCode}`);
    } catch (err) {
      setErrorMsg(err.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex min-h-[65vh] items-center justify-center text-sm text-gray-400"><LoaderCircle className="mr-2 animate-spin" size={18} />กำลังโหลดผังงาน…</div>;
  if (!concert) return <div className="flex min-h-[65vh] flex-col items-center justify-center gap-4 text-center"><p className="text-sm text-gray-400">{loadError || 'ไม่พบคอนเสิร์ต'}</p><Link to="/" className="rounded-xl border border-white/10 px-4 py-2 text-sm">กลับหน้าแรก</Link></div>;

  return (
    <div className="min-h-screen bg-[#09090f] px-4 py-7 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to={`/concerts/${concert.id}`} className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white"><ArrowLeft size={14} />รายละเอียดคอนเสิร์ต</Link>
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300">Choose your zone</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">จองบัตร · {concert.name}</h1><p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400"><MapPin size={13} />{concert.venue || concert.location}</p></div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300"><Ticket size={15} className="text-cyan-200" />1–6 ใบต่อรายการ</div>
        </header>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
          <div className="space-y-5">
            <StadiumZoneMap zones={concert.zones || []} selectedZoneId={selectedZone?.id} onSelect={selectZone} />
            <div className="hidden">
              {concert.zones?.map((zone) => {
                const soldOut = zone.available <= 0;
                const selected = zone.id === selectedZone?.id;
                return <button key={zone.id} type="button" disabled={soldOut} onClick={() => selectZone(zone)} className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${selected ? 'border-cyan-200/70 bg-cyan-200/10 shadow-[0_0_20px_rgba(34,211,238,0.08)]' : 'border-white/10 bg-[#111119] hover:border-white/25'}`}>
                  <div className="flex items-start justify-between gap-2"><span className="font-bold">{zone.name}</span><span className="text-[10px] font-bold text-gray-400">{soldOut ? 'SOLD OUT' : `เหลือ ${zone.available.toLocaleString()}`}</span></div>
                  <div className="mt-2 flex items-end justify-between"><span className="text-2xl font-black text-cyan-100">฿{zone.price.toLocaleString()}<span className="ml-1 text-xs font-semibold text-gray-500">/ ใบ</span></span><span className="text-[10px] uppercase tracking-wider text-gray-500">{zone.category}</span></div>
                </button>;
              })}
            </div>
          </div>

          <aside className="rounded-[26px] border border-white/10 bg-[#111119] p-5 shadow-2xl sm:p-6 xl:sticky xl:top-24">
            <div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-cyan-200/10 p-2.5 text-cyan-100"><Ticket size={19} /></span><div><h2 className="font-black">สรุปการจอง</h2><p className="text-xs text-gray-500">เลือกโซนและจำนวนบัตร</p></div></div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Selected zone</p><p className="mt-1 font-bold">{selectedZone?.name || 'ไม่มีบัตรว่าง'}</p></div><span className="text-lg font-black text-cyan-100">฿{selectedZone?.price?.toLocaleString() || 0}</span></div>
              {selectedZone && <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3"><span className="text-xs text-gray-400">จำนวนบัตร <span className="text-gray-600">(เหลือ {available.toLocaleString()})</span></span><div className="flex items-center gap-3"><button type="button" aria-label="ลดจำนวนบัตร" onClick={() => setQuantity((current) => Math.max(1, current - 1))} disabled={quantity <= 1} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 disabled:opacity-35"><Minus size={15} /></button><span aria-live="polite" className="min-w-5 text-center text-base font-black">{quantity}</span><button type="button" aria-label="เพิ่มจำนวนบัตร" onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))} disabled={quantity >= maxQuantity} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 disabled:opacity-35"><Plus size={15} /></button></div></div>}
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3"><span className="text-xs font-semibold text-gray-300">ยอดรวม</span><span className="text-2xl font-black text-cyan-200">฿{totalPrice.toLocaleString()}</span></div>
            </div>

            <div className="my-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold">ข้อมูลผู้ซื้อ</span>{customerName && <span className="flex items-center gap-1 text-[10px] text-emerald-300"><Check size={12} />{customerName}</span>}</div>
              <label className="mb-3 block space-y-1"><span className="text-[10px] text-gray-400">ชื่อผู้ซื้อ</span><input required value={customerName} onChange={(event) => setCustomerName(event.target.value)} className={inputClass} placeholder="ชื่อที่ใช้บนบัตร" /></label>
              <label className="block space-y-1"><span className="text-[10px] text-gray-400">เบอร์โทรศัพท์</span><input required type="tel" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} className={inputClass} placeholder="08X-XXX-XXXX" /></label>
              <div className="mt-3 rounded-xl border border-[#06c755]/25 bg-[#06c755]/[0.07] p-3">
                {lineUser?.friendFlag === true
                  ? <p className="flex items-center gap-1.5 text-[10px] text-emerald-300"><Check size={12} />เพิ่ม SoundWave Pass bot เป็นเพื่อนแล้ว · {lineUser.displayName}</p>
                  : lineUser?.friendFlag === false
                    ? <p className="text-[10px] leading-relaxed text-amber-200">LINE ตรวจแล้ว: ยังไม่ได้เพิ่ม SoundWave Pass bot เป็นเพื่อน · HTTP {lineUser.friendshipHttpStatus ?? '—'}</p>
                    : <p className="text-[10px] leading-relaxed text-gray-300">{lineUser ? `ล็อกอินแล้ว แต่ตรวจสถานะเพื่อนไม่สำเร็จ (HTTP ${lineUser.friendshipHttpStatus ?? '—'}) · ตรวจการผูก Official Account กับ LINE Login channel` : 'เพิ่ม SoundWave Pass bot เป็นเพื่อน เพื่อรับตั๋วหลังชำระเงินทาง LINE'}</p>}
                <button type="button" onClick={handleLineLogin} disabled={lineLoading} className="mt-2 flex items-center gap-2 rounded-lg bg-[#06c755] px-3 py-2 text-[10px] font-bold text-white hover:bg-[#05b04b] disabled:opacity-60">
                  <UserRound size={13} />{lineLoading ? 'กำลังเปิด LINE…' : lineUser?.friendFlag === true ? 'ตรวจสอบเพื่อน LINE' : lineUser ? 'เพิ่มเพื่อนผ่าน LINE' : 'เพิ่มเพื่อนผ่าน LINE'}
                </button>
              </div>
            </div>

            {errorMsg && <p role="alert" className="mb-4 rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-xs text-rose-200">{errorMsg}</p>}
            <button type="button" onClick={handleBookingSubmit} disabled={submitting || !selectedZone || !maxQuantity} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-200 px-4 py-3.5 text-sm font-black text-[#071016] transition hover:bg-white disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400">{submitting ? <><LoaderCircle size={16} className="animate-spin" />กำลังสร้างรายการ…</> : <>ไปหน้าชำระเงิน<ArrowRight size={16} /></>}</button>
            <p className="mt-3 text-center text-[10px] text-gray-500">ระบบกันบัตรไว้ให้ 10 นาทีหลังสร้างรายการจอง</p>
          </aside>
        </div>
      </div>
    </div>
  );
}

const inputClass = 'w-full rounded-xl border border-white/10 bg-[#09090f] px-3 py-2.5 text-xs text-white outline-none placeholder:text-gray-600 focus:border-cyan-200/60';
