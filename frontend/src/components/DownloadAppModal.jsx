import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Download, X, CheckCircle2, Sparkles, Share, PlusSquare, Apple } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function isRunningInsideApp() {
  if (typeof window === 'undefined') return false;
  const isCapacitor = Boolean(window.Capacitor?.isNativePlatform?.());
  const isElectron = Boolean(window.soundwaveDesktop?.isDesktop || window.electronAPI?.isElectron);
  const isStandalonePwa =
    Boolean(window.matchMedia?.('(display-mode: standalone)')?.matches) ||
    Boolean(window.navigator?.standalone);
  return isCapacitor || isElectron || isStandalonePwa;
}

export default function DownloadAppModal({ open, onClose }) {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [activeGuide, setActiveGuide] = useState(null); // 'desktop' | 'ios' | 'installed'

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (!open) return null;

  const handleDesktopInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setActiveGuide('installed');
      }
      setDeferredPrompt(null);
      return;
    }

    // Create a 1-click Windows Desktop App Launcher (.url shortcut) + show step guide
    try {
      const origin = window.location.origin;
      const shortcutContent = `[InternetShortcut]\r\nURL=${origin}\r\nIconIndex=0\r\n`;
      const blob = new Blob([shortcutContent], { type: 'application/internet-shortcut' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SoundWave Pass (Desktop).url';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // ignore if blocked
    }
    setActiveGuide('desktop');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl border border-white/15 bg-[#0e0e16] p-5 sm:p-7 text-white shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t('ปิดหน้าต่าง', 'Close')}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pr-10">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-black shadow-lg shadow-cyan-500/20">
            <Download size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-400">
              <Sparkles size={12} />
              <span>Multi-Platform Official App</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {t('ดาวน์โหลดแอป SoundWave Pass', 'Download SoundWave Pass App')}
            </h2>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-gray-400 mb-6 leading-relaxed">
          {t(
            'เลือกแพลตฟอร์มที่ต้องการติดตั้งเพื่อใช้งานจองบัตรคอนเสิร์ต ดูตั๋ว QR Code และสแกนเข้างานแบบเต็มหน้าจอได้ทันที (ฟรีทุกแพลตฟอร์ม)',
            'Select your platform below to install SoundWave Pass for full-screen booking, My Ticket QR access, and live gate scanning.'
          )}
        </p>

        {/* 3 Distinct Platform Cards (No QR Code) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Button 1: Desktop (Windows / Mac) */}
          <div className="flex flex-col justify-between rounded-2xl border border-cyan-400/25 bg-gradient-to-b from-cyan-500/10 to-[#141420] p-4 transition hover:border-cyan-400/50">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                  <Monitor size={20} />
                </div>
                <span className="rounded-full bg-cyan-400/15 border border-cyan-400/30 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                  PC / Mac
                </span>
              </div>
              <h3 className="text-sm font-black text-white">
                {t('สำหรับคอมพิวเตอร์', 'Desktop App')}
              </h3>
              <p className="mt-1 text-[11px] text-gray-400 leading-relaxed">
                {t(
                  'รองรับ Windows 10/11 และ macOS เปิดใช้งานเป็นหน้าต่างโปรแกรมเต็มจอ',
                  'For Windows 10/11 & macOS. Runs as a standalone desktop window.'
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={handleDesktopInstall}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs py-2.5 px-3 transition shadow-lg shadow-cyan-400/20 cursor-pointer"
            >
              <Monitor size={15} />
              <span>{t('ติดตั้งลงคอมพิวเตอร์', 'Install for Desktop')}</span>
            </button>
          </div>

          {/* Button 2: Android (.APK) */}
          <div className="flex flex-col justify-between rounded-2xl border border-emerald-400/25 bg-gradient-to-b from-emerald-500/10 to-[#141420] p-4 transition hover:border-emerald-400/50">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
                  <Smartphone size={20} />
                </div>
                <span className="rounded-full bg-emerald-400/15 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  Android .APK
                </span>
              </div>
              <h3 className="text-sm font-black text-white">
                {t('สำหรับมือถือ Android', 'Android Mobile')}
              </h3>
              <p className="mt-1 text-[11px] text-gray-400 leading-relaxed">
                {t(
                  'ดาวน์โหลดไฟล์ติดตั้ง .APK โดยตรง รองรับกล้องสแกน QR และแจ้งเตือนตั๋ว',
                  'Direct .APK download for Android phones with native camera scanner.'
                )}
              </p>
            </div>

            <a
              href="/SoundWave-Pass.apk"
              download="SoundWave-Pass.apk"
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs py-2.5 px-3 transition shadow-lg shadow-emerald-400/20"
            >
              <Download size={15} />
              <span>{t('ดาวน์โหลดไฟล์ .APK', 'Download .APK')}</span>
            </a>
          </div>

          {/* Button 3: iPhone / iOS (Free Web App) */}
          <div className="flex flex-col justify-between rounded-2xl border border-purple-400/25 bg-gradient-to-b from-purple-500/10 to-[#141420] p-4 transition hover:border-purple-400/50">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-400/15 text-purple-300 border border-purple-400/30">
                  <Apple size={20} />
                </div>
                <span className="rounded-full bg-purple-400/15 border border-purple-400/30 px-2.5 py-0.5 text-[10px] font-bold text-purple-300">
                  iOS / iPadOS (Free)
                </span>
              </div>
              <h3 className="text-sm font-black text-white">
                {t('สำหรับ iPhone / iOS', 'iPhone / iOS App')}
              </h3>
              <p className="mt-1 text-[11px] text-gray-400 leading-relaxed">
                {t(
                  'ติดตั้งเป็นแอปบนหน้าจอโฮม iPhone / iPad ฟรี 100% แบบเต็มจอไม่ต้องผ่านสโตร์',
                  '100% Free iOS Home Screen Web App with full-screen native experience.'
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveGuide(activeGuide === 'ios' ? null : 'ios')}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-purple-400 hover:bg-purple-300 text-black font-extrabold text-xs py-2.5 px-3 transition shadow-lg shadow-purple-400/20 cursor-pointer"
            >
              <Apple size={15} />
              <span>{t('ติดตั้งบน iPhone (ฟรี)', 'Install on iOS (Free)')}</span>
            </button>
          </div>
        </div>

        {/* Interactive Guide Banner for iOS / Desktop */}
        {activeGuide === 'ios' && (
          <div className="mt-5 rounded-2xl border border-purple-400/30 bg-purple-500/10 p-4 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-black text-purple-200 text-sm flex items-center gap-2">
                🍎 {t('วิธีติดตั้งแอปบน iPhone / iPad ฟรี (ใช้เวลา 5 วินาที)', 'How to Install on iPhone / iPad (Free)')}
              </span>
              <button
                type="button"
                onClick={() => setActiveGuide(null)}
                className="text-gray-400 hover:text-white text-[11px]"
              >
                {t('ซ่อน', 'Hide')}
              </button>
            </div>
            <ol className="space-y-2 text-gray-200 list-decimal list-inside">
              <li className="flex items-center gap-2 flex-wrap">
                <span>1. {t('เปิดเว็บนี้ในแอป', 'Open this website in')} <strong>Safari</strong> {t('แล้วแตะปุ่ม', 'and tap the')}</span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-0.5 font-bold text-purple-200 border border-white/15">
                  <Share size={12} /> {t('แชร์ (Share)', 'Share')}
                </span>
                <span>{t('ด้านล่างหน้าจอ', 'at the bottom bar.')}</span>
              </li>
              <li className="flex items-center gap-2 flex-wrap">
                <span>2. {t('เลื่อนลงมาแล้วกดเลือกเมนู', 'Scroll down and tap')}</span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-0.5 font-bold text-purple-200 border border-white/15">
                  <PlusSquare size={12} /> {t('เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)', 'Add to Home Screen')}
                </span>
              </li>
              <li>
                3. {t('กด "เพิ่ม" (Add) มุมขวาบน แอป SoundWave Pass จะขึ้นบนหน้าจอมือถือพร้อมใช้งานทันที!', 'Tap "Add" at the top-right corner — the SoundWave Pass icon will appear on your Home Screen!')}
              </li>
            </ol>
          </div>
        )}

        {activeGuide === 'desktop' && (
          <div className="mt-5 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-black text-cyan-200 text-sm flex items-center gap-2">
                💻 {t('ดาวน์โหลดทางลัดเข้าแอปบนคอมพิวเตอร์เรียบร้อยแล้ว!', 'Desktop Shortcut Downloaded!')}
              </span>
              <button
                type="button"
                onClick={() => setActiveGuide(null)}
                className="text-gray-400 hover:text-white text-[11px]"
              >
                {t('ซ่อน', 'Hide')}
              </button>
            </div>
            <p className="text-gray-200 leading-relaxed">
              {t(
                'คุณสามารถดับเบิลคลิกไฟล์ "SoundWave Pass (Desktop).url" ที่ดาวน์โหลดไปเพื่อเปิดใช้งานได้ทันที หรือกดที่ไอคอนรูปหน้าจอคอมพิวเตอร์ ⊕ บนแถบ URL ด้านขวาบนของ Chrome / Edge เพื่อติดตั้งเป็นแอปแยกหน้าต่างเต็มจอ',
                'Open the downloaded "SoundWave Pass (Desktop).url" shortcut anytime, or click the Install App icon ⊕ in your Chrome/Edge address bar to launch in a standalone window.'
              )}
            </p>
          </div>
        )}

        {activeGuide === 'installed' && (
          <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-xs flex items-center gap-2 text-emerald-200 font-bold">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{t('ติดตั้งแอป SoundWave Pass ลงเครื่องเรียบร้อยแล้ว!', 'SoundWave Pass has been installed successfully!')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
