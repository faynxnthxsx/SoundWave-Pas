import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function LineConnectCard({
  lineUser,
  customerLineId,
  customerName,
  lineLoading,
  onLineLogin,
  onMockLineLogin,
  onDisconnectLine,
}) {
  const { t } = useLanguage();

  return (
    <div className="my-5 rounded-2xl border border-[#06c755]/30 bg-[#06c755]/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#06c755] animate-ping" />
          <span className="text-xs font-bold text-white">
            {t('รับตั๋วคอนเสิร์ตเข้าแอป LINE โดยตรง', 'Receive Digital Tickets Directly on LINE')}
          </span>
        </div>
        <span className="text-[10px] bg-[#06c755]/20 text-[#06c755] font-black px-2 py-0.5 rounded-full border border-[#06c755]/30">
          {t('แนะนำ', 'Recommended')}
        </span>
      </div>

      {lineUser || customerLineId ? (
        <div className="flex items-center justify-between bg-black/40 border border-[#06c755]/40 rounded-xl p-3">
          <div className="flex items-center gap-3">
            <img
              src={
                lineUser?.pictureUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
              }
              alt="LINE Profile"
              className="w-10 h-10 rounded-full border border-[#06c755] object-cover"
            />
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                {lineUser?.displayName || customerName || 'LINE User'}
                <CheckCircle2 size={13} className="text-[#06c755]" />
              </p>
              <p className="text-[10px] text-gray-400 font-mono">
                LINE ID: {customerLineId ? `${customerLineId.slice(0, 10)}…` : t('เชื่อมต่อแล้ว', 'Connected')}
              </p>
              <p className="text-[10px] text-[#06c755] font-semibold">
                {t(
                  '✓ ตั๋วจะถูกส่งเข้า LINE อัตโนมัติหลังจ่ายเงิน',
                  '✓ Tickets will be sent to LINE automatically after payment'
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDisconnectLine}
            className="text-[10px] text-gray-400 hover:text-rose-400 px-2 py-1 rounded-lg border border-white/10 hover:border-rose-400/40 transition-colors cursor-pointer"
          >
            {t('ยกเลิก', 'Disconnect')}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onLineLogin}
            disabled={lineLoading}
            className="w-full py-2.5 rounded-xl bg-[#06c755] hover:bg-[#05b34c] text-white font-black text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(6,199,85,0.3)] cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 5.92 2 10.75c0 4.3 3.63 7.9 8.52 8.62.33.07.78.22.89.51.1.26.07.67.03 1.04-.08.76-.36 2.9-.4 3.32-.07.64.24.78.68.54.43-.24 4.7-2.77 6.42-3.79 3.65-2.15 5.86-5.46 5.86-9.24C22 5.92 17.52 2 12 2z" />
            </svg>
            {lineLoading
              ? t('กำลังเชื่อมต่อ LINE...', 'Connecting LINE...')
              : t('เข้าสู่ระบบด้วย LINE (Log in with LINE)', 'Log in with LINE')}
          </button>
          <div className="flex items-center justify-between text-[10px] text-gray-400 px-1 pt-0.5">
            <span>
              {t('ดึงโปรไฟล์และยิงตั๋วเข้าแชตให้อัตโนมัติ', 'Auto-fill profile & send Flex tickets to chat')}
            </span>
            <button
              type="button"
              onClick={onMockLineLogin}
              className="text-cyan-300 hover:underline cursor-pointer font-bold"
            >
              {t('(คลิกทดสอบทันที - บัญชีจำลอง)', '(Quick Demo LINE Login)')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
