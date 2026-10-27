const express = require('express');
const crypto = require('crypto');
const { promisify } = require('util');
const router = express.Router();
const { prisma, hashToken, requireOrganizer } = require('../middleware/organizerAuth');
const scrypt = promisify(crypto.scrypt);
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${derived.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const [salt, hash] = (stored || '').split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = await scrypt(password, salt, expected.length);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

router.post('/login', async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const organizer = await prisma.organizer.findUnique({ where: { username } });
    if (!organizer || !(await verifyPassword(password, organizer.passwordHash))) {
      return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หากลืมรหัสผ่าน ให้กด “ลืมรหัสผ่านเจ้าของงาน?” ด้านล่าง' });
    }

    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
    await prisma.organizerSession.create({
      data: { organizerId: organizer.id, tokenHash: hashToken(token), expiresAt },
    });
    return res.json({
      success: true,
      token,
      expiresAt,
      organizer: { id: organizer.id, username: organizer.username, name: organizer.name },
    });
  } catch (error) {
    console.error('Organizer login error:', error);
    return res.status(500).json({ success: false, message: 'เข้าสู่ระบบเจ้าของงานไม่สำเร็จ' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim();
    const newPassword = String(req.body?.newPassword || '');
    if (newPassword.length < 8 || newPassword.length > 128) return res.status(400).json({ success: false, message: 'รหัสผ่านใหม่ต้องยาว 8–128 ตัวอักษร' });
    const organizer = await prisma.organizer.findUnique({ where: { username } });
    if (!organizer) return res.status(400).json({ success: false, message: 'ไม่พบชื่อผู้ใช้นี้' });
    await prisma.organizer.update({ where: { id: organizer.id }, data: { passwordHash: await hashPassword(newPassword) } });
    await prisma.organizerSession.deleteMany({ where: { organizerId: organizer.id } });
    res.json({ success: true, message: 'ตั้งรหัสผ่านใหม่สำเร็จ' });
  } catch (error) { console.error('Organizer password reset error:', error); res.status(500).json({ success: false, message: 'ไม่สามารถตั้งรหัสผ่านใหม่ได้' }); }
});

router.post('/logout', requireOrganizer, async (req, res) => {
  try {
    await prisma.organizerSession.delete({ where: { id: req.organizerSessionId } });
    return res.json({ success: true });
  } catch (error) {
    console.error('Organizer logout error:', error);
    return res.status(500).json({ success: false, message: 'ออกจากระบบไม่สำเร็จ' });
  }
});

module.exports = router;
