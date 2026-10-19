import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Volume2, ShieldCheck, Ticket } from 'lucide-react';

export default function GateScannerPage() {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef(null);

  // Synthesized Web Audio feedback (no external MP3 needed!)
  const playSound = (type) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      if (type === 'success') {
        // High melodious chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15); // A6
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        // Low double buzzer
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.log('Audio playback prevented or unsupported');
    }
  };

  const handleVerifyTicket = async (ticketCode) => {
    if (!ticketCode || loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/scanner/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCode, scannedBy: 'Gate Staff #1' })
      });

      const data = await res.json();
      setScanResult(data);

      if (data.valid) {
        playSound('success');
      } else {
        playSound('error');
      }
    } catch (err) {
      console.error(err);
      setScanResult({
        valid: false,
        status: 'ERROR',
        message: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ตรวจสอบตั๋วได้'
      });
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError('');
    try {
      const html5QrCode = new Html5Qrcode('reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Scanned successfully!
          handleVerifyTicket(decodedText);
          stopCamera();
        },
        () => {
          // QR parse error in frame, ignore
        }
      );
      setCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('ไม่สามารถเปิดกล้องได้ (กรุณาอนุญาตการเข้าถึงกล้อง หรือทดสอบด้วยการกรอกรหัสตั๋วด้านล่าง)');
      setCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = async () => {
    if (scannerRef.current && cameraActive) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.error(e);
      }
      setCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const resetScan = () => {
    setScanResult(null);
    setManualCode('');
    startCamera();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#39ff14]/15 border border-[#39ff14]/30 text-[#39ff14] text-xs font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-4 h-4" /> Gate Staff Terminal
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          เครื่องสแกนตรวจตั๋วเข้างาน
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          สแกนผ่านกล้องหรือพิมพ์รหัสตั๋วเพื่อตัดสิทธิ์เข้างานทันที
        </p>
      </div>

      {/* Result Display Box */}
      {scanResult && (
        <div className={`mb-6 p-6 rounded-3xl border-2 transition-all ${
          scanResult.valid
            ? 'bg-[#0f2416] border-[#39ff14] shadow-[0_0_30px_rgba(57,255,20,0.3)]'
            : scanResult.status === 'ALREADY_USED'
            ? 'bg-[#261016] border-[#ff007f] shadow-[0_0_30px_rgba(255,0,127,0.3)]'
            : 'bg-[#261f0f] border-[#ffe600] shadow-[0_0_30px_rgba(255,230,0,0.3)]'
        }`}>
          <div className="flex items-center gap-3">
            {scanResult.valid ? (
              <CheckCircle2 className="w-10 h-10 text-[#39ff14] shrink-0" />
            ) : scanResult.status === 'ALREADY_USED' ? (
              <XCircle className="w-10 h-10 text-[#ff007f] shrink-0" />
            ) : (
              <AlertTriangle className="w-10 h-10 text-[#ffe600] shrink-0" />
            )}

            <div>
              <span className={`text-xs font-black uppercase tracking-widest ${
                scanResult.valid ? 'text-[#39ff14]' : 'text-[#ff007f]'
              }`}>
                {scanResult.status}
              </span>
              <h2 className="text-xl font-black text-white leading-tight">
                {scanResult.message}
              </h2>
            </div>
          </div>

          {/* Attendee Info Card if ticket found */}
          {scanResult.data && (
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400">ผู้ถือบัตร:</span>
                <p className="font-bold text-white text-sm">{scanResult.data.attendeeName}</p>
              </div>
              <div>
                <span className="text-gray-400">โซน:</span>
                <p className="font-bold text-[#00f0ff] text-sm">{scanResult.data.zoneName}</p>
              </div>
              <div>
                <span className="text-gray-400">รหัสตั๋ว:</span>
                <p className="font-mono font-bold text-gray-300">{scanResult.data.ticketCode}</p>
              </div>
              {scanResult.data.usedAt && (
                <div>
                  <span className="text-gray-400">เวลาสแกน:</span>
                  <p className="font-mono text-gray-300">
                    {new Date(scanResult.data.usedAt).toLocaleTimeString('th-TH')}
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={resetScan}
            className="mt-6 w-full py-3 rounded-xl bg-white text-black font-extrabold uppercase text-xs flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> สแกนคนถัดไป (Next Attendee)
          </button>
        </div>
      )}

      {/* Camera Viewport */}
      {!scanResult && (
        <div className="bg-[#12121e] border border-[#27273e] rounded-3xl p-6 text-center">
          <div className="relative max-w-sm mx-auto overflow-hidden rounded-2xl bg-black aspect-square flex items-center justify-center border-2 border-[#2b2b42]">
            <div id="reader" className="w-full h-full"></div>
            
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0d0d15]">
                <Camera className="w-12 h-12 text-gray-500 mb-3" />
                <p className="text-xs text-gray-400 mb-4">
                  กดปุ่มด้านล่างเพื่อเปิดกล้องเว็บแคมหรือกล้องมือถือ
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-6 py-2.5 rounded-xl bg-[#00f0ff] text-black font-bold text-xs uppercase hover:bg-white transition-colors cursor-pointer"
                >
                  เปิดกล้องสแกนเนอร์
                </button>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="mt-3 text-xs text-[#ff007f] bg-[#ff007f]/10 p-2.5 rounded-xl">
              {cameraError}
            </div>
          )}

          {cameraActive && (
            <button
              type="button"
              onClick={stopCamera}
              className="mt-4 px-4 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-xs font-semibold hover:bg-gray-700"
            >
              ปิดกล้อง
            </button>
          )}

          {/* Manual Input Fallback (Great for testing!) */}
          <div className="mt-8 pt-6 border-t border-[#222238] text-left">
            <span className="text-xs text-gray-400 font-semibold block mb-2">
              หรือทดสอบด้วยการกรอกรหัสตั๋วโดยตรง:
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="เช่น SWP-VIP-889901"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                className="flex-1 bg-[#1a1a2b] border border-[#2e2e46] rounded-xl px-4 py-2 text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:border-[#00f0ff]"
              />
              <button
                type="button"
                disabled={loading || !manualCode.trim()}
                onClick={() => handleVerifyTicket(manualCode)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#ff007f] text-black font-black text-xs uppercase hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'ตรวจ...' : 'ตรวจสอบ'}
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-2">
              * ทิป: ลองกรอก <code className="text-[#00f0ff]">SWP-VIP-889901</code> (ตั๋วทดสอบที่ Seed ไว้ในฐานข้อมูล)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
