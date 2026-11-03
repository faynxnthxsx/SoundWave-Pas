import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, isDark } = useTheme();
  const { t } = useLanguage();

  const label = isDark
    ? t('สลับเป็นโหมดสว่าง', 'Switch to light mode')
    : t('สลับเป็นโหมดมืด', 'Switch to dark mode');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`theme-toggle-btn group inline-flex items-center justify-center rounded-full border p-1 sm:p-1.5 transition-all duration-300 cursor-pointer shrink-0 select-none active:scale-95 ${
        isDark
          ? 'border-white/15 bg-black/60 text-amber-300 hover:border-amber-400/40 hover:bg-white/5 hover:text-amber-200 shadow-inner'
          : 'border-slate-300 bg-white text-amber-600 hover:border-amber-400 hover:bg-amber-50 shadow-sm'
      } ${className}`}
    >
      <div className="relative w-4 h-4 sm:w-4 sm:h-4 flex items-center justify-center">
        {isDark ? (
          <Moon className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
        ) : (
          <Sun className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110 text-amber-500" />
        )}
      </div>
    </button>
  );
}
