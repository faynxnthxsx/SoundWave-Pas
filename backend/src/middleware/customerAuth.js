const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const tokenHash = (token) => crypto.createHash('sha256').update(token).digest('hex');

function extractToken(req) {
  // 1. Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match) return match[1].trim();
  }

  // 2. Custom header x-soundwave-session or soundwave_session
  const customHeader = req.headers['x-soundwave-session'] || req.headers['soundwave_session'] || req.headers['soundwave-session'];
  if (customHeader) return String(customHeader).trim();

  // 3. Cookie soundwave_session
  if (req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\s*)soundwave_session=([^;]+)/);
    if (match) return decodeURIComponent(match[1].trim());
  }

  // 4. Request body
  if (req.body?.soundwave_session) {
    return String(req.body.soundwave_session).trim();
  }

  return null;
}

async function requireCustomer(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'กรุณาเข้าสู่ระบบก่อนทำรายการจองบัตร'
    });
  }

  try {
    const hashed = tokenHash(token);
    const session = await prisma.authSession.findUnique({
      where: { tokenHash: hashed },
      include: { customer: true }
    });

    if (!session || session.expiresAt <= new Date()) {
      if (session) {
        await prisma.authSession.delete({ where: { id: session.id } }).catch(() => {});
      }
      return res.status(401).json({
        success: false,
        message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง'
      });
    }

    req.customer = session.customer;
    req.customerSessionId = session.id;
    return next();
  } catch (error) {
    console.error('Customer auth validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะผู้ใช้งาน'
    });
  }
}

module.exports = { prisma, tokenHash, extractToken, requireCustomer };
