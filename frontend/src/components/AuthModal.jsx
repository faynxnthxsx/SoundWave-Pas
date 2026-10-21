import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function AuthModal({ onClose, onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [lineUserId, setLineUserId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/auth/${mode === 'register' ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, lineUserId }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
      onAuthenticated({ user: data.user, token: data.token, expiresAt: data.expiresAt });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="auth-title" className="w-full max-w-md rounded-3xl border border-white/15 bg-[#111119] p-6 shadow-2xl">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">SoundWave Pass</p>
            <h2 id="auth-title" className="mt-1 text-2xl font-black">{mode === 'register' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</h2>
            <p className="mt-1 text-xs text-gray-400">{mode === 'register' ? 'สร้างบัญชีเพื่อเก็บข้อมูลผู้ใช้ของคุณ' : 'ล็อกอินเพื่อเข้าสู่บัญชีของคุณ'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="ปิด" className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"><X size={18} /></button>
        </header>

        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-1.5"><span className="text-xs text-gray-300">Username</span><input autoComplete="username" required minLength={3} maxLength={24} value={username} onChange={(event) => setUsername(event.target.value)} className={fieldClass} placeholder="ชื่อผู้ใช้" /></label>
          <label className="block space-y-1.5"><span className="text-xs text-gray-300">Password</span><input autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={8} maxLength={128} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={fieldClass} placeholder="อย่างน้อย 8 ตัวอักษร" /></label>
          {mode === 'register' && <label className="block space-y-1.5"><span className="text-xs text-gray-300">LINE User ID <span className="text-gray-500">(ไม่บังคับ)</span></span><input maxLength={64} value={lineUserId} onChange={(event) => setLineUserId(event.target.value)} className={fieldClass} placeholder="U…" /></label>}
          {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-200">{error}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-black hover:bg-cyan-200 disabled:opacity-50">{busy ? 'กำลังดำเนินการ…' : mode === 'register' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</button>
        </form>
        <p className="mt-5 text-center text-xs text-gray-400">
          {mode === 'register' ? 'มีบัญชีแล้ว?' : 'ยังไม่มีบัญชี?'}{' '}
          <button type="button" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }} className="font-bold text-cyan-200 hover:text-white">{mode === 'register' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</button>
        </p>
      </section>
    </div>
  );
}

const fieldClass = 'w-full rounded-xl border border-white/10 bg-[#09090f] px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/60';
