import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CheckCircle2, XCircle, AlertTriangle, RefreshCw, ShieldCheck, UserCheck, LogOut, Lock, KeyRound, User } from 'lucide-react';

export default function GateScannerPage() {
  // Staff Authentication State
  const [staff, setStaff] = useState(() => {
    try {
      const saved = localStorage.getItem('soundwave_staff');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Scanner State
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef(null);

  // Handle Staff Login
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setLoginError('กรุณากรอก Username และ Password ให้ครบถ้วน');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/scanner/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.message || 'Username หรือ Password ไม่ถูกต้อง');
      } else {
        setStaff(data.staff);
        localStorage.setItem('soundwave_staff', JSON.stringify(data.staff));
        setUsername('');
        setPassword('');
      }
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์หลังบ้านได้ (ตรวจสอบว่า Backend เปิดอยู่หรือไม่)');
    } finally {
      setLoginLoading(false);
    }
  };

  // Quick fill test account
  const handleQuickLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
    setLoginError('');
  };

  // Handle Staff Logout
  const handleLogout = () => {
    stopCamera();
    localStorage.removeItem('soundwave_staff');
    setStaff(null);
    setScanResult(null);
  };

  // Synthesized Web Audio feedback
  const playSound = (type) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      if (type === 'success') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
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
      console.log('Audio feedback prevented or unsupported');
    }
  };

  const handleVerifyTicket = async (ticketCode) => {
    if (!ticketCode || loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/scanner/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ticketCode, 
          scannedBy: staff ? staff.name : 'เจ้าหน้าที่ไม่ระบุตัวตน' 
        })
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
          handleVerifyTicket(decodedText);
          stopCamera();
        },
        () => {}
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

  // ==========================================
  // VIEW 1: Staff Login Screen (ยังไม่ล็อกอิน)
  // ==========================================
  if (!staff) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-[#10101c] border border-[#26263e] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Neon Glow Corner */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f0ff]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-wide">
              เข้าสู่ระบบเจ้าหน้าที่
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              เฉพาะสตาฟฟ์และฝ่ายรักษาความปลอดภัยหน้างาน
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-3 rounded-xl bg-[#ff007f]/10 border border-[#ff007f]/30 text-[#ff007f] text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="เช่น faye หรือ nam"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#181829] border border-[#2e2e4a] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00f0ff] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="กรอกรหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#181829] border border-[#2e2e4a] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00f0ff] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#00a8ff] text-black font-extrabold text-sm uppercase tracking-wider hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.25)]"
            >
              {loginLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบตรวจตั๋ว'}
            </button>
          </form>

          {/* Quick Click Demo Logins */}
          <div className="mt-8 pt-6 border-t border-[#222238] text-center">
            <span className="text-[11px] text-gray-400 font-semibold block mb-2.5">
              ⚡ บัญชีทดสอบด่วน (คลิกเพื่อเลือก):
            </span>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={() => handleQuickLogin('faye', '1234')}
                className="px-3 py-1.5 rounded-lg bg-[#1e1e32] border border-[#333350] hover:border-[#00f0ff] text-xs text-gray-200 transition-colors cursor-pointer"
              >
                👑 เฟย์ (faye / 1234)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('nam', '1234')}
                className="px-3 py-1.5 rounded-lg bg-[#1e1e32] border border-[#333350] hover:border-[#39ff14] text-xs text-gray-200 transition-colors cursor-pointer"
              >
                📱 น้ำ (nam / 1234)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: Staff Scanner Console (ล็อกอินแล้ว)
  // ==========================================
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Logged In Staff Identity Banner */}
      <div className="mb-6 p-3.5 rounded-2xl bg-[#121220] border border-[#2b2b46] flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00f0ff]/15 border border-[#00f0ff]/40 flex items-center justify-center text-[#00f0ff]">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#00f0ff] bg-[#00f0ff]/10 px-2 py-0.5 rounded-full">
                {staff.role === 'SUPERVISOR' ? 'หัวหน้าสตาฟฟ์' : 'เจ้าหน้าที่ตรวจตั๋ว'}
              </span>
              <span className="w-2 h-2 rounded-full bg-[#39ff14] animate-pulse" />
            </div>
            <p className="text-sm font-bold text-white mt-0.5">
              {staff.name} <span className="text-xs font-normal text-gray-400">(@{staff.username})</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> ออกจากระบบ
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#39ff14]/15 border border-[#39ff14]/30 text-[#39ff14] text-xs font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-4 h-4" /> Terminal Active
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
              <div>
                <span className="text-gray-400">สแกนโดย:</span>
                <p className="font-bold text-[#39ff14] text-xs">
                  {scanResult.data.scannedBy || staff.name}
                </p>
              </div>
              {scanResult.data.usedAt && (
                <div className="col-span-2">
                  <span className="text-gray-400">เวลาที่สแกน:</span>
                  <p className="font-mono text-gray-300">
                    {new Date(scanResult.data.usedAt).toLocaleString('th-TH')}
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
                placeholder="เช่น SWP-STA-ROCKER-001"
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
              * ตัวอย่างตั๋ว: <code className="text-[#39ff14]">SWP-STA-ROCKER-001</code> (ตั๋วผ่าน) หรือ <code className="text-[#ff007f]">SWP-STA-USED99-003</code> (ตั๋วใช้แล้ว)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
