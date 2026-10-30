import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  return <footer className="border-t border-white/5 bg-[#07070b] px-4 py-4"><div className="mx-auto flex max-w-6xl items-center justify-between text-[10px] text-gray-600"><span>© SoundWave Pass</span><Link to="/team" aria-label={t('เข้าสู่พื้นที่ทีมงาน', 'Team Portal')} title={t('พื้นที่ทีมงาน', 'Team Portal')} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-gray-500 transition hover:bg-white/5 hover:text-gray-300"><ShieldCheck size={13} />{t('พื้นที่ทีมงาน', 'Team Portal')}</Link></div></footer>;
}
