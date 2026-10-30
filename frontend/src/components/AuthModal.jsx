import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import Button from './ui/Button';

export default function AuthModal({ onClose, onAuthenticated }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [lineUserId, setLineUserId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!username.trim() || !password) { setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน'); return; }
    setBusy(true);
    setError('');
    try {
      const endpoint = mode === 'register' ? 'register' : mode === 'forgot' ? 'forgot-password' : 'login';
      const response = await fetch(`/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, lineUserId }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
      if (mode === 'forgot') { setMode('login'); setPassword(''); setError(data.message); return; }
      onAuthenticated({ user: data.user, token: data.token, expiresAt: data.expiresAt }); onClose();
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
            <h2 id="auth-title" className="mt-1 text-2xl font-black">{mode === 'register' ? t('สมัครสมาชิก', 'Create Account') : mode === 'forgot' ? t('ลืมรหัสผ่าน', 'Reset Password') : t('เข้าสู่ระบบ', 'Sign In')}</h2>
            <p className="mt-1 text-xs text-gray-400">{mode === 'register' ? t('สร้างบัญชีเพื่อเก็บข้อมูลผู้ใช้ของคุณ', 'Create an account to save your tickets') : mode === 'forgot' ? t('ยืนยันชื่อผู้ใช้และ LINE ID เพื่อเปลี่ยนรหัสผ่าน', 'Verify your username and LINE ID to reset password') : t('ล็อกอินเพื่อเข้าสู่บัญชีของคุณ', 'Sign in to access your account & tickets')}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="ปิด" className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"><X size={18} /></button>
        </header>

        <form noValidate onSubmit={submit} className="space-y-4">
          <label className="block space-y-1.5"><span className="text-xs text-gray-300">Username</span><input autoComplete="username" required minLength={3} maxLength={24} value={username} onChange={(event) => setUsername(event.target.value)} className={fieldClass} placeholder={t('ชื่อผู้ใช้', 'Username')} /></label>
          {(mode === 'register' || mode === 'forgot') && <label className="block space-y-1.5"><span className="text-xs text-gray-300">LINE User ID <span className="text-gray-500">{t('(ถ้าผูกไว้กับบัญชี)', '(optional)')}</span></span><input maxLength={64} value={lineUserId} onChange={(event) => setLineUserId(event.target.value)} className={fieldClass} placeholder="U…" /></label>}
          <label className="block space-y-1.5"><span className="text-xs text-gray-300">{mode === 'forgot' ? t('รหัสผ่านใหม่', 'New Password') : 'Password'}</span><span className="relative block"><input autoComplete={mode === 'register' || mode === 'forgot' ? 'new-password' : 'current-password'} required minLength={8} maxLength={128} type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className={`${fieldClass} pr-11`} placeholder={t('อย่างน้อย 8 ตัวอักษร', 'At least 8 characters')} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-200">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
          {error && <div role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-left"><p className="text-xs font-bold text-rose-100">{t('เข้าสู่ระบบไม่สำเร็จ', 'Authentication Failed')}</p><p className="mt-1 text-xs leading-5 text-rose-200">{error}</p></div>}
          <Button type="submit" variant="primary" size="lg" disabled={busy} className="w-full">{busy ? t('กำลังดำเนินการ…', 'Processing…') : mode === 'register' ? t('สมัครสมาชิก', 'Register') : mode === 'forgot' ? t('ตั้งรหัสผ่านใหม่', 'Reset Password') : t('เข้าสู่ระบบ', 'Sign In')}</Button>
        </form>
        <p className="mt-5 text-center text-xs text-gray-400">
          {mode === 'login' && <><button type="button" onClick={() => { setMode('forgot'); setError(''); }} className="font-bold text-cyan-200 hover:text-white">{t('ลืมรหัสผ่าน?', 'Forgot password?')}</button><span className="mx-2">·</span></>}
          <button type="button" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }} className="font-bold text-cyan-200 hover:text-white">{mode === 'register' ? t('เข้าสู่ระบบ', 'Sign In') : t('สมัครสมาชิก', 'Create Account')}</button>
        </p>
      </section>
    </div>
  );
}

const fieldClass = 'w-full rounded-xl border border-white/10 bg-[#09090f] px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/60';
