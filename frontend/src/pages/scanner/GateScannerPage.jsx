import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  LogOut,
  KeyRound,
  Eye,
  EyeOff,
  SwitchCamera,
  Image as ImageIcon,
  Zap,
  Volume2,
  VolumeX,
} from 'lucide-react';

// Extract clean ticket code from URLs or raw scan text
export const extractTicketCode = (raw) => {
  if (!raw) return '';
  let cleaned = String(raw).trim();
  // Decode URL if encoded
  try {
    if (cleaned.includes('%')) cleaned = decodeURIComponent(cleaned);
  } catch {}

  // If it's a URL like /tickets/SWP-XXX or /tickets/SWP-XXX/print
  if (cleaned.includes('/tickets/')) {
    const match = cleaned.match(/\/tickets\/([A-Za-z0-9_-]+)/);
    if (match && match[1]) return match[1].trim();
  }
  // If it's a qrserver or query param URL with data=SWP-XXX
  if (cleaned.includes('data=')) {
    const match = cleaned.match(/data=([A-Za-z0-9_%-]+)/);
    if (match && match[1]) return match[1].trim();
  }
  // If it contains slashes, take the last segment
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/').filter(Boolean);
    cleaned = parts[parts.length - 1];
  }
  // Strip query string and hash
  cleaned = cleaned.split('?')[0].split('#')[0].trim();
  return cleaned;
};

export default function GateScannerPage() {
  // Staff Authentication State
  const [staff, setStaff] = useState(() => {
    try {
      const saved = localStorage.getItem('soundwave_staff');
      const session = saved ? JSON.parse(saved) : null;
      return session?.sessionToken ? session : null;
    } catch {
      return null;
    }
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Scanner State
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [continuousMode, setContinuousMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentScans, setRecentScans] = useState([]);

  const scannerRef = useRef(null);
  const scanHandledRef = useRef(false);
  const autoResumeTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Initialize or resume Web Audio Context on user gesture
  const initAudio = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } catch {}
  };

  // Synthesized Web Audio & Haptic Feedback
  const playSound = (type) => {
    // Haptic vibration on mobile phones
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        if (type === 'success') {
          navigator.vibrate([100]);
        } else {
          navigator.vibrate([200, 100, 200]);
        }
      } catch {}
    }

    if (!soundEnabled) return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      if (type === 'success') {
        // High-pitch dual chime
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now);
        osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc1.start(now);
        osc1.stop(now + 0.25);
      } else {
        // Low-pitch buzzer
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch {
      /* ignore audio errors */
    }
  };

  // Handle Staff Login
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    initAudio();
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
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.message || 'Username หรือ Password ไม่ถูกต้อง');
      } else {
        const session = { ...data.staff, sessionToken: data.token, expiresAt: data.expiresAt };
        setStaff(session);
        localStorage.setItem('soundwave_staff', JSON.stringify(session));
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/scanner/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'ตั้งรหัสผ่านไม่สำเร็จ');
      setForgotMode(false);
      setPassword('');
      setLoginError(data.message);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // Quick fill test accounts
  const handleQuickLogin = (u, p) => {
    initAudio();
    setUsername(u);
    setPassword(p);
    setLoginError('');
  };

  // Handle Staff Logout
  const handleLogout = () => {
    stopCamera();
    if (staff?.sessionToken) {
      fetch('/api/scanner/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${staff.sessionToken}` },
      }).catch(() => {});
    }
    localStorage.removeItem('soundwave_staff');
    setStaff(null);
    setScanResult(null);
  };

  // Enumerate cameras once staff is logged in
  useEffect(() => {
    if (!staff) return;
    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (cameras && cameras.length > 0) {
          setAvailableCameras(cameras);
          const backCam = cameras.find((c) => /back|rear|environment|หลัง/i.test(c.label));
          setSelectedCameraId(backCam ? backCam.id : cameras[0].id);
        }
      })
      .catch((err) => {
        console.warn('Could not list cameras:', err);
      });
  }, [staff]);

  // Main Ticket Verification Handler
  const handleVerifyTicket = async (rawCode) => {
    const ticketCode = extractTicketCode(rawCode);
    if (!ticketCode || loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/scanner/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staff?.sessionToken || ''}`,
        },
        body: JSON.stringify({
          ticketCode,
          scannedBy: staff ? staff.name : 'เจ้าหน้าที่ไม่ระบุตัวตน',
        }),
      });

      const data = await res.json();
      setScanResult(data);

      if (data.valid) {
        playSound('success');
      } else {
        playSound('error');
      }

      // Add to recent scans history list
      setRecentScans((prev) => [
        {
          code: ticketCode,
          name: data.data?.attendeeName || 'N/A',
          valid: data.valid,
          status: data.status,
          time: new Date().toLocaleTimeString('th-TH'),
        },
        ...prev.slice(0, 9),
      ]);

      // If continuous mode is ON and camera is still running, auto-resume after 2.5s
      if (continuousMode && scannerRef.current) {
        if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
        autoResumeTimerRef.current = setTimeout(() => {
          scanHandledRef.current = false;
        }, 2200);
      }
    } catch (err) {
      console.error(err);
      setScanResult({
        valid: false,
        status: 'ERROR',
        message: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ตรวจสอบตั๋วได้',
      });
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  // Start Camera with Dynamic Config for Mobile & PC
  const startCamera = async (cameraIdOverride) => {
    if (scannerRef.current) return;
    initAudio();
    setCameraError('');
    scanHandledRef.current = false;

    const qrboxFunction = (viewfinderWidth, viewfinderHeight) => {
      const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
      const size = Math.floor(minEdge * 0.72);
      return {
        width: Math.max(200, size),
        height: Math.max(200, size),
      };
    };

    const config = {
      fps: 15,
      qrbox: qrboxFunction,
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true,
      },
    };

    const onDecoded = (decodedText) => {
      if (scanHandledRef.current) return;
      scanHandledRef.current = true;
      if (!continuousMode) {
        void stopCamera();
      }
      void handleVerifyTicket(decodedText);
    };

    try {
      const html5QrCode = new Html5Qrcode('reader');
      scannerRef.current = html5QrCode;

      const targetCamera = cameraIdOverride || selectedCameraId;

      if (targetCamera) {
        await html5QrCode.start(targetCamera, config, onDecoded, () => {});
      } else {
        try {
          await html5QrCode.start({ facingMode: 'environment' }, config, onDecoded, () => {});
        } catch {
          // Fallback to first available camera on desktop/laptop
          const cameras = await Html5Qrcode.getCameras();
          if (!cameras.length) throw new Error('ไม่พบกล้องในอุปกรณ์นี้');
          setAvailableCameras(cameras);
          const chosen = cameras.find((c) => /back|rear|environment/i.test(c.label)) || cameras[0];
          setSelectedCameraId(chosen.id);
          await html5QrCode.start(chosen.id, config, onDecoded, () => {});
        }
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      scannerRef.current = null;
      setCameraActive(false);

      const reason =
        err?.name === 'NotAllowedError'
          ? 'เบราว์เซอร์ยังไม่ได้รับอนุญาตให้ใช้กล้อง โปรดกดไอคอนกุญแจ 🔒 ข้างแถบที่อยู่เว็บ แล้วเลือก "อนุญาตการใช้กล้อง (Allow Camera)"'
          : err?.name === 'NotFoundError'
          ? 'ไม่พบกล้องที่เชื่อมต่อกับอุปกรณ์'
          : err?.name === 'NotReadableError'
          ? 'กล้องกำลังถูกใช้งานโดยแอปพลิเคชันอื่น โปรดปิดโปรแกรมอื่นแล้วลองใหม่'
          : 'เปิดกล้องไม่สำเร็จ ตรวจสอบสิทธิ์การเข้าถึงกล้องบนเบราว์เซอร์';
      setCameraError(reason);
    }
  };

  // Stop Camera
  const stopCamera = async () => {
    const scanner = scannerRef.current;
    if (scanner) {
      scannerRef.current = null;
      try {
        await scanner.stop();
      } catch (e) {
        /* ignore */
      }
      try {
        scanner.clear();
      } catch (e) {
        /* ignore */
      }
      setCameraActive(false);
    }
  };

  // Flip Camera between back and front lens
  const toggleFlipCamera = async () => {
    if (!availableCameras.length) return;
    const currentIdx = availableCameras.findIndex((c) => c.id === selectedCameraId);
    const nextIdx = (currentIdx + 1) % availableCameras.length;
    const nextCam = availableCameras[nextIdx];
    setSelectedCameraId(nextCam.id);
    if (cameraActive) {
      await stopCamera();
      setTimeout(() => startCamera(nextCam.id), 250);
    }
  };

  // Scan from an Image File / Screenshot (from LINE photo or saved QR)
  const handleScanImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    initAudio();
    setCameraError('');

    try {
      let tempScanner = scannerRef.current;
      let needCleanup = false;
      if (!tempScanner) {
        tempScanner = new Html5Qrcode('reader-hidden');
        needCleanup = true;
      }
      const decodedText = await tempScanner.scanFile(file, true);
      if (needCleanup) {
        try {
          tempScanner.clear();
        } catch {}
      }
      await handleVerifyTicket(decodedText);
    } catch (err) {
      console.error('File scan error:', err);
      setCameraError('ไม่พบ QR Code ในรูปภาพที่เลือก กรุณาเลือกรูปภาพ QR Code ที่ชัดเจน');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
    };
  }, []);

  const resetScan = () => {
    setScanResult(null);
    scanHandledRef.current = false;
    startCamera();
  };

  // ==========================================
  // VIEW 1: Staff Login View (ยังไม่ได้ล็อกอิน)
  // ==========================================
  if (!staff) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-[#12121e] border border-[#27273e] rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300 mx-auto mb-3 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white">ระบบสแกนตั๋วหน้างาน</h1>
            <p className="text-xs text-gray-400 mt-1">SoundWave Pass Gate Check-in Terminal</p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={forgotMode ? handleForgotPassword : handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                ชื่อผู้ใช้ (Username)
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="เช่น faye, nam, gate01"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#181829] border border-[#2e2e4a] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                {forgotMode ? 'รหัสผ่านใหม่ (Password)' : 'รหัสผ่าน (Password)'}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="กรอกรหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#181829] border border-[#2e2e4a] rounded-xl pl-10 pr-11 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full mt-2 py-3 rounded-xl bg-cyan-300 hover:bg-cyan-200 text-black font-extrabold text-sm uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-cyan-400/20"
            >
              {loginLoading ? 'กำลังดำเนินการ...' : forgotMode ? 'ตั้งรหัสผ่านใหม่' : 'เข้าสู่ระบบตรวจตั๋ว'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setForgotMode(!forgotMode);
              setLoginError('');
            }}
            className="mt-4 w-full text-xs font-bold text-cyan-200 hover:text-white"
          >
            {forgotMode ? 'กลับเข้าสู่ระบบ' : 'ลืมรหัสผ่านพนักงาน?'}
          </button>

          {/* Quick Click Demo Logins */}
          <div className="mt-8 pt-6 border-t border-[#222238] text-center">
            <span className="text-[11px] text-gray-400 font-semibold block mb-2.5">
              ⚡ บัญชีทดสอบด่วน (คลิกเพื่อเลือกทันที):
            </span>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={() => handleQuickLogin('nam', '1234')}
                className="px-3 py-1.5 rounded-lg bg-[#1e1e32] border border-[#333350] hover:border-emerald-400 text-xs text-gray-200 transition-colors cursor-pointer"
              >
                📱 น้ำ (nam / 1234)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('faye', '1234')}
                className="px-3 py-1.5 rounded-lg bg-[#1e1e32] border border-[#333350] hover:border-cyan-400 text-xs text-gray-200 transition-colors cursor-pointer"
              >
                👑 เฟย์ (faye / 1234)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('gate01', '1234')}
                className="px-3 py-1.5 rounded-lg bg-[#1e1e32] border border-[#333350] hover:border-amber-400 text-xs text-gray-200 transition-colors cursor-pointer"
              >
                🚪 ประตู 1 (gate01 / 1234)
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
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      {/* Hidden container for image file scanning */}
      <div id="reader-hidden" className="hidden"></div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleScanImageFile}
        className="hidden"
      />

      {/* Logged In Staff Identity Banner */}
      <div className="mb-5 p-3.5 rounded-2xl bg-[#121220] border border-[#2b2b46] flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-400/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-300 bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/30">
                {staff.role === 'SUPERVISOR' ? 'หัวหน้าสตาฟฟ์' : 'เจ้าหน้าที่ตรวจตั๋ว'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-sm font-bold text-white mt-0.5">
              {staff.name} <span className="text-xs font-normal text-gray-400">(@{staff.username})</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            title={soundEnabled ? 'ปิดเสียงแจ้งเตือน' : 'เปิดเสียงแจ้งเตือน'}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            {soundEnabled ? <Volume2 size={16} className="text-cyan-400" /> : <VolumeX size={16} />}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Control Toolbar: Continuous Mode & Camera Switcher */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={continuousMode}
              onChange={(e) => setContinuousMode(e.target.checked)}
              className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
            />
            <span className="font-bold text-gray-200 flex items-center gap-1">
              <Zap size={14} className={continuousMode ? 'text-amber-400 animate-pulse' : 'text-gray-500'} />
              โหมดสแกนคิวต่อเนื่อง
            </span>
          </label>
          <span className="text-[10px] text-gray-400 hidden sm:inline">(ตรวจคนถัดไปอัตโนมัติ)</span>
        </div>

        {availableCameras.length > 1 && (
          <button
            type="button"
            onClick={toggleFlipCamera}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer font-semibold"
          >
            <SwitchCamera size={14} className="text-cyan-400" />
            <span>สลับกล้อง</span>
          </button>
        )}
      </div>

      {/* Result Display Box */}
      {scanResult && (!continuousMode || !cameraActive) && (
        <div
          className={`mb-6 p-5 sm:p-6 rounded-3xl border-2 transition-all animate-in fade-in ${
            scanResult.valid
              ? 'bg-[#0f2416] border-emerald-400 shadow-[0_0_30px_rgba(57,255,20,0.3)]'
              : scanResult.status === 'ALREADY_USED'
              ? 'bg-[#261016] border-rose-500 shadow-[0_0_30px_rgba(255,0,127,0.3)]'
              : 'bg-[#261f0f] border-amber-400 shadow-[0_0_30px_rgba(255,230,0,0.3)]'
          }`}
        >
          <div className="flex items-start gap-3">
            {scanResult.valid ? (
              <CheckCircle2 className="w-9 h-9 text-emerald-400 shrink-0 mt-0.5" />
            ) : scanResult.status === 'ALREADY_USED' ? (
              <XCircle className="w-9 h-9 text-rose-500 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-9 h-9 text-amber-400 shrink-0 mt-0.5" />
            )}

            <div className="min-w-0 flex-1">
              <span
                className={`text-[11px] font-black uppercase tracking-widest ${
                  scanResult.valid ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {scanResult.status}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight mt-0.5">
                {scanResult.message}
              </h2>
            </div>
          </div>

          {/* Attendee Info Card if ticket found */}
          {scanResult.data && (
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3 text-xs bg-black/20 p-3.5 rounded-2xl">
              <div>
                <span className="text-gray-400 text-[11px]">ผู้ถือบัตร:</span>
                <p className="font-bold text-white text-sm">{scanResult.data.attendeeName}</p>
              </div>
              <div>
                <span className="text-gray-400 text-[11px]">โซน:</span>
                <p className="font-bold text-cyan-300 text-sm">{scanResult.data.zoneName}</p>
              </div>
              <div>
                <span className="text-gray-400 text-[11px]">ที่นั่ง:</span>
                <p className="font-mono font-black text-amber-300 text-sm">
                  {scanResult.data.seatNumber || 'บัตรยืน (Standing GA)'}
                </p>
              </div>
              <div>
                <span className="text-gray-400 text-[11px]">รหัสตั๋ว:</span>
                <p className="font-mono font-bold text-gray-300 truncate">{scanResult.data.ticketCode}</p>
              </div>
              {scanResult.data.usedAt && (
                <div className="col-span-2 pt-2 border-t border-white/5">
                  <span className="text-gray-400 text-[11px]">เวลาที่บันทึกเข้างาน:</span>
                  <p className="font-mono text-gray-300 text-xs">
                    {new Date(scanResult.data.usedAt).toLocaleString('th-TH')} (โดย {scanResult.data.scannedBy || staff.name})
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={resetScan}
            className="mt-5 w-full py-3 rounded-xl bg-white text-black font-extrabold uppercase text-xs flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors cursor-pointer shadow-md"
          >
            <RefreshCw className="w-4 h-4" /> สแกนคนถัดไป (Next Attendee)
          </button>
        </div>
      )}

      {/* Camera Viewport */}
      {(!scanResult || continuousMode) && (
        <div className="bg-[#12121e] border border-[#27273e] rounded-3xl p-4 sm:p-6 text-center shadow-xl">
          {/* Viewfinder Wrapper */}
          <div className="relative max-w-sm mx-auto overflow-hidden rounded-3xl bg-black aspect-square flex items-center justify-center border-2 border-cyan-400/40 shadow-[0_0_30px_rgba(0,240,255,0.15)]">
            <div id="reader" className="w-full h-full"></div>

            {/* Neon Viewfinder Frame & Animated Laser Overlay */}
            {cameraActive && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                {/* 4 Neon Corners */}
                <div className="relative w-[72%] h-[72%] border border-cyan-400/30 rounded-2xl">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl shadow-[0_0_10px_#00f0ff]" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400 rounded-tr-xl shadow-[0_0_10px_#00f0ff]" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400 rounded-bl-xl shadow-[0_0_10px_#00f0ff]" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400 rounded-br-xl shadow-[0_0_10px_#00f0ff]" />

                  {/* Animated Scanning Laser Line */}
                  <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_12px_#00f0ff] animate-bounce top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            {/* Continuous Mode Live Overlay Toast */}
            {continuousMode && scanResult && (
              <div
                className={`absolute inset-x-3 bottom-3 p-3.5 rounded-2xl border backdrop-blur-md shadow-2xl transition-all ${
                  scanResult.valid ? 'bg-emerald-950/90 border-emerald-400 text-white' : 'bg-rose-950/90 border-rose-500 text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  {scanResult.valid ? <CheckCircle2 size={18} className="text-emerald-400" /> : <XCircle size={18} className="text-rose-400" />}
                  <span className="text-xs font-black truncate">{scanResult.message}</span>
                </div>
                {scanResult.data && (
                  <p className="mt-1 text-[11px] text-gray-200">
                    {scanResult.data.attendeeName} · <strong className="text-cyan-300">{scanResult.data.zoneName}</strong> ({scanResult.data.seatNumber || 'บัตรยืน'})
                  </p>
                )}
              </div>
            )}

            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0d0d15]/95">
                <div className="w-16 h-16 rounded-3xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300 mb-3 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">กล้องสแกนเนอร์พร้อมทำงาน</h3>
                <p className="text-xs text-gray-400 mb-4 max-w-xs">
                  ส่อง QR Code จากแอป LINE, ตั๋วดิจิทัลบนมือถือ หรือตั๋วที่พิมพ์ใส่กระดาษ A4
                </p>
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="px-6 py-3 rounded-xl bg-cyan-300 hover:bg-cyan-200 text-black font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-cyan-400/20"
                >
                  เปิดกล้องสแกนเนอร์
                </button>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="mt-4 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-2xl flex items-center gap-2 text-left">
              <AlertTriangle size={16} className="shrink-0 text-rose-400" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Action Buttons below Camera */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {cameraActive && (
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 text-xs font-semibold transition-all cursor-pointer"
              >
                พักกล้อง
              </button>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400 text-gray-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <ImageIcon size={14} className="text-cyan-400" />
              <span>เลือกรูปภาพ QR จากเครื่อง / LINE</span>
            </button>
          </div>

          {/* Manual Input Fallback */}
          <div className="mt-6 pt-5 border-t border-white/10 text-left">
            <span className="text-xs text-gray-400 font-semibold block mb-2">
              หรือทดสอบด้วยการกรอกรหัสตั๋วโดยตรง (หรือยิงด้วยเครื่องบาร์โค้ด USB):
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="เช่น SWP-STAN-6BJ6-5306"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualCode.trim()) {
                    handleVerifyTicket(manualCode);
                  }
                }}
                className="flex-1 bg-[#1a1a2b] border border-[#2e2e46] rounded-xl px-4 py-2.5 text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                disabled={loading || !manualCode.trim()}
                onClick={() => handleVerifyTicket(manualCode)}
                className="px-5 py-2.5 rounded-xl bg-cyan-300 hover:bg-cyan-200 text-black font-extrabold text-xs uppercase disabled:opacity-50 transition-all cursor-pointer shrink-0"
              >
                {loading ? 'ตรวจ...' : 'ตรวจสอบ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Scans History in this Session */}
      {recentScans.length > 0 && (
        <div className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
            ประวัติการสแกนรอบนี้ ({recentScans.length} ใบ):
          </span>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {recentScans.map((scan, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/[0.03] border border-white/5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${scan.valid ? 'bg-emerald-400' : 'bg-rose-500'}`}
                  />
                  <span className="font-mono text-gray-300">{scan.code}</span>
                  <span className="text-gray-400 truncate max-w-[120px]">({scan.name})</span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">{scan.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
