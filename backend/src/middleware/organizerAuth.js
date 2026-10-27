const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

function unauthorized(res) {
  return res.status(401).json({ success: false, message: 'ต้องเข้าสู่ระบบด้วยบัญชีผู้จัดงานก่อน' });
}

async function requireOrganizer(req, res, next) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return unauthorized(res);

  try {
    const session = await prisma.organizerSession.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { organizer: true },
    });
    if (!session || session.expiresAt <= new Date()) {
      if (session) await prisma.organizerSession.delete({ where: { id: session.id } });
      return unauthorized(res);
    }
    req.organizer = session.organizer;
    req.organizerSessionId = session.id;
    return next();
  } catch (error) {
    console.error('Organizer session validation failed:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ผู้จัดงาน' });
  }
}

module.exports = { prisma, hashToken, requireOrganizer };
