import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export function FlagTH({ className = 'w-4 h-3' }) {
  return (
    <svg viewBox="0 0 24 16" className={`${className} rounded-[2px] shadow-xs shrink-0`} aria-hidden="true">
      <rect width="24" height="16" fill="#A51931" />
      <rect y="2.67" width="24" height="10.67" fill="#F4F5F8" />
      <rect y="5.33" width="24" height="5.33" fill="#2D2A4A" />
    </svg>
  );
}

export function FlagEN({ className = 'w-4 h-3' }) {
  return (
    <svg viewBox="0 0 24 16" className={`${className} rounded-[2px] shadow-xs shrink-0`} aria-hidden="true">
      <rect width="24" height="16" fill="#012169" />
      <path d="M0,0 L24,16 M24,0 L0,16" stroke="#FFFFFF" strokeWidth="3.2" />
      <path d="M0,0 L24,16 M24,0 L0,16" stroke="#C8102E" strokeWidth="1.6" />
      <path d="M12,0 V16 M0,8 H24" stroke="#FFFFFF" strokeWidth="5.2" />
      <path d="M12,0 V16 M0,8 H24" stroke="#C8102E" strokeWidth="3" />
    </svg>
  );
}

export default function LanguageSwitch({ className = '' }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language Switcher"
      className={`inline-flex items-center rounded-full border border-white/15 bg-black/60 p-0.5 shadow-inner backdrop-blur-md ${className}`}
    >
      <button
        type="button"
        onClick={() => setLang('th')}
        title="ภาษาไทย (Thai)"
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black tracking-wide transition-all cursor-pointer ${
          lang === 'th'
            ? 'bg-gradient-to-r from-cyan-400 to-teal-300 text-black shadow-[0_0_12px_rgba(34,211,238,0.45)]'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <FlagTH />
        <span>TH</span>
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        title="English (EN)"
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black tracking-wide transition-all cursor-pointer ${
          lang === 'en'
            ? 'bg-gradient-to-r from-cyan-400 to-teal-300 text-black shadow-[0_0_12px_rgba(34,211,238,0.45)]'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <FlagEN />
        <span>EN</span>
      </button>
    </div>
  );
}
