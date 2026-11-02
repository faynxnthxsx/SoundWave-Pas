import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import Button from './ui/Button';

export default function AuthModal({ onClose, onAuthenticated }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [lineUserId, setLineUserId] = useState('');
  const [googleClientId, setGoogleClientId] = useState(
    '557764937679-q1jasgmin88nv5vb4magnsc0l0idonq2.apps.googleusercontent.com'
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetch('/api/auth/google/config')
      .then((r) => r.json())
      .then((d) => {
        if (d?.clientId) setGoogleClientId(d.clientId);
      })
      .catch(() => {});
  }, []);

  const handleGoogleSignIn = () => {
    setError('');
    if (!googleClientId) {
      setError(t('ไม่พบการตั้งค่า Google Client ID', 'Google Client ID not configured'));
      return;
    }

    try {
      sessionStorage.setItem('sw_google_auth_state', window.location.pathname + window.location.search);
    } catch {}

    const redirectUri = window.location.origin;
    const scope = encodeURIComponent('openid email profile');
    const state = encodeURIComponent(window.location.pathname + window.location.search);
    const nonce = Math.random().toString(36).substring(2);

    // Standard OAuth2 full-page redirect (Works 100% on mobile without popups or blank tabs)
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token%20id_token&scope=${scope}&state=${state}&nonce=${nonce}&prompt=select_account`;

    window.location.href = googleAuthUrl;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const endpoint = mode === 'register' ? 'register' : mode === 'forgot' ? 'forgot-password' : 'login';
      const bodyPayload =
        mode === 'forgot'
          ? { username, lineUserId, newPassword: password }
          : { username, password, lineUserId };
      const response = await fetch(`/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
      if (mode === 'forgot') {
        setMode('login');
        setPassword('');
        setError(data.message);
        return;
      }
      onAuthenticated({ user: data.user, token: data.token, expiresAt: data.expiresAt });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md transition-opacity"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f1118] p-5 sm:p-6 shadow-2xl transition-all"
        style={{ fontFamily: "'Prompt', system-ui, sans-serif" }}
      >
        <header className="mb-4 flex items-start justify-between">
          <div>
            <span className="inline-block text-[11px] font-semibold tracking-wider uppercase text-cyan-400">
              SOUNDWAVE PASS
            </span>
            <h2 id="auth-title" className="mt-0.5 text-xl font-bold text-white tracking-normal">
              {mode === 'register'
                ? t('สมัครสมาชิก', 'Create Account')
                : mode === 'forgot'
                ? t('ลืมรหัสผ่าน', 'Reset Password')
                : t('เข้าสู่ระบบ', 'Sign In')}
            </h2>
            <p className="mt-1 text-xs text-gray-400 font-light leading-relaxed">
              {mode === 'register'
                ? t('สร้างบัญชีเพื่อจัดการบัตรคอนเสิร์ตของคุณ', 'Create an account to manage your tickets')
                : mode === 'forgot'
                ? t('ยืนยันชื่อผู้ใช้และ LINE ID เพื่อตั้งรหัสผ่านใหม่', 'Verify username & LINE ID to reset password')
                : t('ล็อกอินเพื่อดูบัตรและประวัติการซื้อ', 'Sign in to access your tickets and history')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </header>

        {/* Clean Standard Google Sign-In Button (ไม่มี preview ชื่อ/รูป ค้างในกล่อง) */}
        {mode !== 'forgot' && (
          <div className="mb-4">
            <button
              type="button"
              disabled={busy}
              onClick={handleGoogleSignIn}
              className="w-full h-11 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 active:scale-[0.99] text-white font-medium text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>
                {busy ? t('กำลังเข้าสู่ระบบ...', 'Signing in...') : t('เข้าสู่ระบบด้วย Google', 'Sign in with Google')}
              </span>
            </button>

            <div className="relative my-3 flex items-center justify-center">
              <div className="w-full border-t border-white/10" />
              <span className="bg-[#0f1118] px-2.5 text-[10px] font-medium tracking-wider text-gray-500 uppercase">
                {t('หรือ', 'OR')}
              </span>
              <div className="w-full border-t border-white/10" />
            </div>
          </div>
        )}

        <form noValidate onSubmit={submit} className="space-y-3">
          <label className="block space-y-1 text-left">
            <span className="text-[11px] font-medium text-gray-300">
              {mode === 'login' ? t('ชื่อผู้ใช้ หรือ อีเมล', 'Username or Email') : t('ชื่อผู้ใช้', 'Username')}
            </span>
            <input
              autoComplete="username"
              required
              minLength={3}
              maxLength={64}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className={fieldClass}
              placeholder={mode === 'login' ? t('ชื่อผู้ใช้ หรือ อีเมล', 'Username or email') : t('ตั้งชื่อผู้ใช้', 'Username')}
            />
          </label>

          {(mode === 'register' || mode === 'forgot') && (
            <label className="block space-y-1 text-left">
              <span className="text-[11px] font-medium text-gray-300">
                LINE User ID <span className="text-gray-500">{t('(ไม่บังคับ)', '(optional)')}</span>
              </span>
              <input
                maxLength={64}
                value={lineUserId}
                onChange={(event) => setLineUserId(event.target.value)}
                className={fieldClass}
                placeholder="U…"
              />
            </label>
          )}

          <label className="block space-y-1 text-left">
            <span className="text-[11px] font-medium text-gray-300">
              {mode === 'forgot' ? t('รหัสผ่านใหม่', 'New Password') : t('รหัสผ่าน', 'Password')}
            </span>
            <span className="relative block">
              <input
                autoComplete={mode === 'register' || mode === 'forgot' ? 'new-password' : 'current-password'}
                required
                minLength={8}
                maxLength={128}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`${fieldClass} pr-9`}
                placeholder={t('อย่างน้อย 8 ตัวอักษร', 'At least 8 characters')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-200 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </span>
          </label>

          {error && (
            <div role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-2.5 text-left">
              <p className="text-xs leading-relaxed text-rose-200">{error}</p>
            </div>
          )}

          <Button type="submit" variant="primary" size="md" disabled={busy} className="w-full text-xs font-semibold py-2.5 mt-1">
            {busy
              ? t('กำลังดำเนินการ…', 'Processing…')
              : mode === 'register'
              ? t('สมัครสมาชิก', 'Register')
              : mode === 'forgot'
              ? t('ตั้งรหัสผ่านใหม่', 'Reset Password')
              : t('เข้าสู่ระบบ', 'Sign In')}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400 font-light">
          {mode === 'login' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setError('');
                }}
                className="font-normal text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer"
              >
                {t('ลืมรหัสผ่าน?', 'Forgot password?')}
              </button>
              <span className="mx-2 text-gray-600">·</span>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'register' ? 'login' : 'register');
              setError('');
            }}
            className="font-medium text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer"
          >
            {mode === 'register' ? t('เข้าสู่ระบบ', 'Sign In') : t('สมัครสมาชิกใหม่', 'Create Account')}
          </button>
        </p>
      </section>
    </div>
  );
}

const fieldClass =
  'w-full rounded-xl border border-white/10 bg-[#141620] px-3 py-2 text-xs text-white outline-none placeholder:text-gray-500 focus:border-cyan-400/60 transition-colors font-light';
