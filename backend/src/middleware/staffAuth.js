const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

function unauthorized(res) {
  return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบเจ้าหน้าที่ใหม่อีกครั้ง' });
}

async function requireStaff(req, res, next) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return unauthorized(res);

  try {
    const session = await prisma.staffSession.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { staff: true },
    });
    if (!session || session.expiresAt <= new Date()) {
      if (session) await prisma.staffSession.delete({ where: { id: session.id } });
      return unauthorized(res);
    }
    req.staff = session.staff;
    req.staffSessionId = session.id;
    return next();
  } catch (error) {
    console.error('Staff session validation failed:', error);
    return res.status(500).json({ success: false, message: 'ตรวจสอบสิทธิ์เจ้าหน้าที่ไม่สำเร็จ' });
  }
}

function requireSupervisor(req, res, next) {
  if (req.staff?.role !== 'SUPERVISOR') {
    return res.status(403).json({ success: false, message: 'ต้องเข้าสู่ระบบด้วยบัญชีผู้ดูแล' });
  }
  return next();
}

module.exports = { prisma, hashToken, requireStaff, requireSupervisor };
