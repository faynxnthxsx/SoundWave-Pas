import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Download, Smartphone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { isRunningInsideApp } from './DownloadAppModal';

export default function Footer() {
  const { t } = useLanguage();
  const isAppShell = isRunningInsideApp();

  const openDownloadModal = () => {
    window.dispatchEvent(new Event('open_soundwave_download'));
  };

  return (
    <footer className="border-t border-white/5 bg-[#07070b] px-4 pt-4 pb-20 md:py-4">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 text-[10px] text-gray-600">
        <span>© SoundWave Pass</span>
        <div className="flex flex-wrap items-center gap-2">
          {!isAppShell && (
            <>
              <button
                type="button"
                onClick={openDownloadModal}
                aria-label={t('ดาวน์โหลดแอป (PC / Android / iOS)', 'Download App (PC / Android / iOS)')}
                title={t('ดาวน์โหลดแอป SoundWave Pass สำหรับคอมพิวเตอร์และมือถือ', 'Download SoundWave Pass App for Desktop & Mobile')}
                className="flex items-center gap-1.5 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1.5 font-bold text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20 cursor-pointer"
              >
                <Download size={13} />
                <span>{t('ดาวน์โหลดแอป (PC / Android / iOS)', 'Download App (PC / Mobile)')}</span>
              </button>
              <a
                href="/SoundWave-Pass.apk"
                download="SoundWave-Pass.apk"
                aria-label={t('โหลดไฟล์ APK โดยตรง', 'Direct APK Download')}
                title={t('ดาวน์โหลดไฟล์ติดตั้ง Android (.APK) ทันที', 'Direct Android .APK Download')}
                className="flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 font-medium text-emerald-400 transition hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:text-emerald-300"
              >
                <Smartphone size={13} />
                <span>{t('โหลด .APK', 'Direct .APK')}</span>
              </a>
            </>
          )}
          <Link
            to="/team"
            aria-label={t('เข้าสู่พื้นที่ทีมงาน', 'Team Portal')}
            title={t('พื้นที่ทีมงาน', 'Team Portal')}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-gray-500 transition hover:bg-white/5 hover:text-gray-300"
          >
            <ShieldCheck size={13} />
            {t('พื้นที่ทีมงาน', 'Team Portal')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
