const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { promisify } = require('util');
const { PrismaClient } = require('@prisma/client');
const { getLineBotInfo } = require('../services/lineService');
const prisma = new PrismaClient();
const scrypt = promisify(crypto.scrypt);

const publicUser = ({ id, username, lineUserId, createdAt }) => ({ id, username, lineUserId, createdAt });
const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${derived.toString('hex')}`;
};
const verifyPassword = async (password, stored) => {
  const [salt, hash] = (stored || '').split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = await scrypt(password, salt, expected.length);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};
const tokenHash = (token) => crypto.createHash('sha256').update(token).digest('hex');
const startSession = async (customerId) => {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.authSession.create({ data: { customerId, tokenHash: tokenHash(token), expiresAt } });
  return { token, expiresAt };
};

router.post('/register', async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    const lineUserId = String(req.body?.lineUserId || '').trim() || null;
    if (!/^[A-Za-z0-9_.-]{3,24}$/.test(username)) {
      return res.status(400).json({ success: false, message: 'Username ต้องยาว 3–24 ตัว และใช้ได้เฉพาะตัวอักษรอังกฤษ ตัวเลข . _ -' });
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ success: false, message: 'Password ต้องยาว 8–128 ตัวอักษร' });
    }
    if (lineUserId && lineUserId.length > 64) {
      return res.status(400).json({ success: false, message: 'LINE User ID ไม่ถูกต้อง' });
    }
    const customer = await prisma.customer.create({
      data: { username, passwordHash: await hashPassword(password), lineUserId },
    });
    const session = await startSession(customer.id);
    res.status(201).json({ success: true, user: publicUser(customer), ...session });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'Username หรือ LINE User ID นี้ถูกใช้แล้ว' });
    console.error('Customer registration error:', error);
    res.status(500).json({ success: false, message: 'สมัครสมาชิกไม่สำเร็จ' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    const customer = await prisma.customer.findUnique({ where: { username } });
    if (!customer || !(await verifyPassword(password, customer.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Username หรือ Password ไม่ถูกต้อง' });
    }
    const session = await startSession(customer.id);
    res.json({ success: true, user: publicUser(customer), ...session });
  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({ success: false, message: 'เข้าสู่ระบบไม่สำเร็จ' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token) return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบ' });
    const session = await prisma.authSession.findUnique({
      where: { tokenHash: tokenHash(token) },
      include: { customer: true },
    });
    if (!session || session.expiresAt <= new Date()) {
      if (session) await prisma.authSession.delete({ where: { id: session.id } });
      return res.status(401).json({ success: false, message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' });
    }
    res.json({ success: true, user: publicUser(session.customer), expiresAt: session.expiresAt });
  } catch (error) {
    console.error('Customer session lookup error:', error);
    res.status(500).json({ success: false, message: 'ตรวจสอบสถานะผู้ใช้ไม่สำเร็จ' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (token) await prisma.authSession.deleteMany({ where: { tokenHash: tokenHash(token) } });
    res.json({ success: true });
  } catch (error) {
    console.error('Customer logout error:', error);
    res.status(500).json({ success: false, message: 'ออกจากระบบไม่สำเร็จ' });
  }
});

// GET /api/auth/line/config - Return client ID and redirect URI
router.get('/line/config', async (req, res) => {
  let officialAccountUrl = null;
  try {
    const botInfo = await getLineBotInfo();
    if (botInfo?.basicId) {
      const basicId = botInfo.basicId.startsWith('@') ? botInfo.basicId : `@${botInfo.basicId}`;
      officialAccountUrl = `https://line.me/R/ti/p/${basicId}`;
    }
  } catch (error) {
    console.warn('Could not load LINE Official Account link:', error.message);
  }
  res.json({
    channelId: process.env.LINE_LOGIN_CHANNEL_ID || '2012117630',
    callbackUrl: process.env.LINE_LOGIN_CALLBACK_URL || 'http://localhost:5173/booking/zone-select',
    officialAccountUrl
  });
});

// POST /api/auth/line/verify - Exchange auth code for user profile
router.post('/line/verify', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Missing auth code' });
    }

    const channelId = process.env.LINE_LOGIN_CHANNEL_ID || '2012117630';
    const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET;
    if (!channelSecret) {
      return res.status(503).json({ success: false, message: 'LINE Login ยังไม่ได้ตั้งค่า กรุณากำหนด LINE_LOGIN_CHANNEL_SECRET' });
    }
    const redirectUri = process.env.LINE_LOGIN_CALLBACK_URL || 'http://localhost:5173/booking/zone-select';

    // 1. Exchange code for access token
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code.trim(),
      redirect_uri: redirectUri,
      client_id: channelId,
      client_secret: channelSecret
    });

    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString()
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('LINE token error:', tokenData);
      return res.status(400).json({ 
        success: false, 
        message: tokenData.error_description || tokenData.error || 'Failed to exchange token with LINE' 
      });
    }

    // 2. Fetch User Profile using access token
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const profile = await profileRes.json();
    if (!profileRes.ok) {
      return res.status(400).json({ success: false, message: 'Failed to fetch LINE profile' });
    }

    let friendFlag = null;
    let friendshipHttpStatus = null;
    try {
      const friendshipRes = await fetch('https://api.line.me/friendship/v1/status', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      friendshipHttpStatus = friendshipRes.status;
      if (friendshipRes.ok) {
        const friendship = await friendshipRes.json();
        friendFlag = Boolean(friendship.friendFlag);
      } else {
        console.warn(`LINE friendship status check failed with HTTP ${friendshipRes.status}`);
      }
    } catch (error) {
      console.warn('Could not check LINE Official Account friendship:', error.message);
    }

    res.json({
      success: true,
      user: {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        statusMessage: profile.statusMessage,
        friendFlag,
        friendshipHttpStatus
      }
    });
  } catch (error) {
    console.error('Error during LINE Login exchange:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;
