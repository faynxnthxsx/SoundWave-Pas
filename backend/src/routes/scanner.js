const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { promisify } = require('util');
const { PrismaClient } = require('@prisma/client');
const { hashToken, requireStaff } = require('../middleware/staffAuth');
const prisma = new PrismaClient();
const scrypt = promisify(crypto.scrypt);
const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString('hex')}`;
};
const verifyPassword = async (password, staff) => {
  if (staff.passwordHash) {
    const [salt, hash] = staff.passwordHash.split(':');
    if (!salt || !hash) return false;
    const expected = Buffer.from(hash, 'hex');
    const actual = await scrypt(password, salt, expected.length);
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  }
  const expected = crypto.createHash('sha256').update(staff.password || '').digest();
  const actual = crypto.createHash('sha256').update(password).digest();
  return crypto.timingSafeEqual(actual, expected);
};

// POST /api/scanner/login - Staff Authentication
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'กรุณากรอก Username และ Password' 
      });
    }

    const staff = await prisma.staff.findUnique({
      where: { username: username.trim().toLowerCase() }
    });

    if (!staff || !(await verifyPassword(password, staff))) {
      return res.status(401).json({ 
        success: false, 
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หากลืมรหัสผ่าน ให้กด “ลืมรหัสผ่านพนักงาน?” ด้านล่าง' 
      });
    }

    // Upgrade legacy plaintext seed accounts after their first successful login.
    if (!staff.passwordHash) {
      const passwordHash = await hashPassword(password);
      await prisma.staff.update({ where: { id: staff.id }, data: { passwordHash, password: null } });
    }

    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
    await prisma.staffSession.create({
      data: { staffId: staff.id, tokenHash: hashToken(token), expiresAt },
    });

    res.json({
      success: true,
      token,
      expiresAt,
      message: 'เข้าสู่ระบบสำเร็จ',
      staff: {
        id: staff.id,
        username: staff.username,
        name: staff.name,
        role: staff.role
      }
    });
  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim();
    const newPassword = String(req.body?.newPassword || '');
    if (newPassword.length < 8 || newPassword.length > 128) return res.status(400).json({ success: false, message: 'รหัสผ่านใหม่ต้องยาว 8–128 ตัวอักษร' });
    const staff = await prisma.staff.findUnique({ where: { username } });
    if (!staff) return res.status(400).json({ success: false, message: 'ไม่พบชื่อผู้ใช้นี้' });
    await prisma.staff.update({ where: { id: staff.id }, data: { passwordHash: await hashPassword(newPassword), password: null } });
    await prisma.staffSession.deleteMany({ where: { staffId: staff.id } });
    res.json({ success: true, message: 'ตั้งรหัสผ่านใหม่สำเร็จ' });
  } catch (error) { console.error('Staff password reset error:', error); res.status(500).json({ success: false, message: 'ไม่สามารถตั้งรหัสผ่านใหม่ได้' }); }
});

router.post('/logout', requireStaff, async (req, res) => {
  try {
    await prisma.staffSession.delete({ where: { id: req.staffSessionId } });
    res.json({ success: true });
  } catch (error) {
    console.error('Staff logout error:', error);
    res.status(500).json({ success: false, message: 'ออกจากระบบไม่สำเร็จ' });
  }
});

// POST /api/scanner/verify - Gate Staff ticket scanner validation
router.post('/verify', requireStaff, async (req, res) => {
  try {
    let { ticketCode } = req.body;

    if (!ticketCode) {
      return res.status(400).json({ success: false, valid: false, message: 'กรุณาระบุรหัสตั๋ว' });
    }

    // Clean up ticket code (supports direct code, URLs like /tickets/SWP-XXX, or QR generator URLs with data=SWP-XXX)
    if (ticketCode.includes('/tickets/')) {
      const match = ticketCode.match(/\/tickets\/([A-Za-z0-9_-]+)/);
      if (match && match[1]) ticketCode = match[1];
    } else if (ticketCode.includes('data=')) {
      const match = ticketCode.match(/data=([A-Za-z0-9_%-]+)/);
      if (match && match[1]) ticketCode = decodeURIComponent(match[1]);
    } else if (ticketCode.includes('/')) {
      const parts = ticketCode.trim().split('/').filter(Boolean);
      ticketCode = parts[parts.length - 1];
    }
    ticketCode = ticketCode.split('?')[0].split('#')[0].trim();

    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode },
      include: {
        zone: {
          include: {
            concert: true
          }
        },
        booking: true
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        valid: false,
        status: "INVALID",
        message: "❌ ไม่พบข้อมูลตั๋วใบนี้ในระบบ (บัตรปลอมหรือไม่ถูกต้อง)"
      });
    }

    // Check if already used
    if (ticket.status === 'USED') {
      return res.status(409).json({
        success: false,
        valid: false,
        status: "ALREADY_USED",
        message: "⚠️ ตั๋วใบนี้ถูกสแกนเข้างานไปแล้ว!",
        data: {
          ticketCode: ticket.ticketCode,
          attendeeName: ticket.attendeeName,
          zoneName: ticket.zone.name,
          seatNumber: ticket.seatNumber,
          usedAt: ticket.usedAt,
          scannedBy: ticket.scannedBy || "Gate Staff"
        }
      });
    }

    if (ticket.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        valid: false,
        status: "CANCELLED",
        message: "❌ ตั๋วใบนี้ถูกยกเลิกแล้ว"
      });
    }

    if (ticket.status === 'RESERVED') {
      return res.status(400).json({
        success: false,
        valid: false,
        status: "RESERVED",
        message: "❌ ตั๋วใบนี้เป็นที่นั่งสำรองโดยผู้จัด ยังไม่ได้ออกเป็นตั๋วเข้างาน"
      });
    }

    // Mark as USED
    const updateResult = await prisma.ticket.updateMany({
      where: { id: ticket.id, status: 'VALID' },
      data: {
        status: 'USED',
        usedAt: new Date(),
        scannedBy: req.staff.name || req.staff.username
      }
    });

    if (updateResult.count !== 1) {
      const latest = await prisma.ticket.findUnique({ where: { id: ticket.id } });
      return res.status(409).json({
        success: false,
        valid: false,
        status: latest?.status === 'USED' ? 'ALREADY_USED' : (latest?.status || 'INVALID'),
        message: '⚠️ ตั๋วใบนี้ถูกสแกนเข้างานไปแล้ว กรุณาตรวจสอบสถานะล่าสุด',
        data: latest ? { ticketCode: latest.ticketCode, attendeeName: latest.attendeeName, usedAt: latest.usedAt, scannedBy: latest.scannedBy } : undefined,
      });
    }

    const updatedTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });

    res.json({
      success: true,
      valid: true,
      status: "VALID",
      message: "✅ ตรวจสอบผ่าน - ยินดีต้อนรับเข้าสู่งาน SoundWave Festival!",
      data: {
        ticketCode: updatedTicket.ticketCode,
        attendeeName: updatedTicket.attendeeName,
        seatNumber: updatedTicket.seatNumber,
        zoneName: ticket.zone.name,
        concertName: ticket.zone.concert.name,
        usedAt: updatedTicket.usedAt
      }
    });
  } catch (error) {
    console.error('Error verifying ticket:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

module.exports = router;
