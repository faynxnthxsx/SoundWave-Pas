const express = require('express');
const router = express.Router();

// GET /api/auth/line/config - Return client ID and redirect URI
router.get('/line/config', (req, res) => {
  res.json({
    channelId: process.env.LINE_LOGIN_CHANNEL_ID || '2012117630',
    callbackUrl: process.env.LINE_LOGIN_CALLBACK_URL || 'http://localhost:5173/booking/zone-select'
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
    const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET || '3804835736cc32b7b645515b927ab198';
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

    res.json({
      success: true,
      user: {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        statusMessage: profile.statusMessage
      }
    });
  } catch (error) {
    console.error('Error during LINE Login exchange:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;
