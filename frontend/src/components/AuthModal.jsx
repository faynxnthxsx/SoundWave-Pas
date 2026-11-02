import React, { useState, useEffect, useRef } from 'react';
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
  const [isGsiBlocked, setIsGsiBlocked] = useState(false);
  const googleBtnRef = useRef(null);

  useEffect(() => {
    fetch('/api/auth/google/config')
      .then((r) => r.json())
      .then((d) => {
        if (d?.clientId) setGoogleClientId(d.clientId);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!googleClientId || !googleBtnRef.current) return;
    const initGsi = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          use_fedcm_for_prompt: true,
          auto_select: false,
          callback: async (response) => {
            if (!response?.credential) return;
            await handleGoogleLogin({ credential: response.credential });
          },
        });
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: 280,
          text: 'signin_with',
          shape: 'pill',
          logo_alignment: 'left',
        });
      } catch (err) {
        console.warn('Google GSI render error:', err);
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGsi;
    script.onerror = () => {
      setIsGsiBlocked(true);
    };
    document.head.appendChild(script);
  }, [googleClientId, mode]);

  const handleGoogleLogin = async (payload) => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || t('เข้าสู่ระบบด้วย Google ไม่สำเร็จ', 'Google Sign-In failed'));
      }
      onAuthenticated({ user: data.user, token: data.token, expiresAt: data.expiresAt });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
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

        {/* Official Google Sign-In Button */}
        {mode !== 'forgot' && (
          <div className="mb-4">
            <div className={`flex justify-center items-center w-full min-h-[44px] ${busy ? 'pointer-events-none opacity-50' : ''}`}>
              <div ref={googleBtnRef} className="flex justify-center" />
            </div>

            {isGsiBlocked && (
              <p className="mt-2 text-[11px] text-amber-400/90 text-center">
                {t(
                  'หากปุ่ม Google ไม่แสดง กรุณาปิด AdBlock หรือเข้าสู่ระบบด้วยชื่อผู้ใช้ด้านล่าง',
                  'If Google Sign-In is blocked by an extension, please disable AdBlock or sign in below.'
                )}
              </p>
            )}

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
