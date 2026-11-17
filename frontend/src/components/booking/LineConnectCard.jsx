import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function LineConnectCard({
  lineUser,
  customerLineId,
  customerName,
  lineLoading,
  onLineLogin,
  onMockLineLogin: _onMockLineLogin,
  onDisconnectLine,
}) {
  const { t } = useLanguage();
  const isConnected = Boolean(lineUser || customerLineId);

  return (
    <div className="line-connect-box my-5 rounded-2xl border border-[#06c755]/30 bg-[#06c755]/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#06c755]" />
          <span className="text-xs font-bold text-white">
            {t('รับตั๋วคอนเสิร์ตเข้าแอป LINE โดยตรง', 'Receive Digital Tickets Directly on LINE')}
          </span>
        </div>
        <span className="line-badge-recommended text-[10px] bg-[#06c755]/20 text-[#06c755] font-black px-2 py-0.5 rounded-full border border-[#06c755]/30">
          {isConnected ? t('เชื่อมต่อแล้ว', 'Connected') : t('แนะนำ', 'Recommended')}
        </span>
      </div>

      {isConnected ? (
        <div className="space-y-2">
          <div className="w-full py-2.5 px-3.5 rounded-xl bg-[#06c755] text-white font-black text-xs flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 size={16} className="shrink-0 text-white" />
              <span className="truncate">
                {t(
                  `เชื่อมต่อ LINE แล้ว (${customerName || lineUser?.displayName || 'LINE Verified'})`,
                  `LINE Connected (${customerName || lineUser?.displayName || 'LINE Verified'})`
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={onDisconnectLine}
              className="shrink-0 rounded-lg bg-black/20 hover:bg-black/35 px-2.5 py-1 text-[10px] font-bold text-white transition-colors cursor-pointer"
            >
              {t('ยกเลิก', 'Disconnect')}
            </button>
          </div>
          <div className="text-[10px] text-gray-400 px-1 pt-0.5">
            <span>
              {t(
                '✓ ข้อมูลผู้ซื้อคงเดิม ตั๋วจะถูกส่งเข้าแชท LINE อัตโนมัติหลังชำระเงิน',
                '✓ Buyer details preserved — Flex tickets will be sent to LINE automatically'
              )}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onLineLogin}
            disabled={lineLoading}
            className="line-login-btn w-full py-2.5 rounded-xl bg-[#06c755] hover:bg-[#05b34c] text-white font-black text-xs uppercase flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 5.92 2 10.75c0 4.3 3.63 7.9 8.52 8.62.33.07.78.22.89.51.1.26.07.67.03 1.04-.08.76-.36 2.9-.4 3.32-.07.64.24.78.68.54.43-.24 4.7-2.77 6.42-3.79 3.65-2.15 5.86-5.46 5.86-9.24C22 5.92 17.52 2 12 2z" />
            </svg>
            {lineLoading
              ? t('กำลังเชื่อมต่อ LINE...', 'Connecting LINE...')
              : t('เข้าสู่ระบบด้วย LINE (Log in with LINE)', 'Log in with LINE')}
          </button>
          <div className="text-[10px] text-gray-400 px-1 pt-0.5">
            <span>
              {t('ดึงโปรไฟล์และยิงตั๋วเข้าแชตให้อัตโนมัติ', 'Auto-fill profile & send Flex tickets to chat')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
