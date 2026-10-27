require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const concertsRouter = require('./routes/concerts');
const bookingsRouter = require('./routes/bookings');
const ticketsRouter = require('./routes/tickets');
const scannerRouter = require('./routes/scanner');
const authRouter = require('./routes/auth');
const organizerRouter = require('./routes/organizer');
const adminRouter = require('./routes/admin');
const locationsRouter = require('./routes/locations');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '7mb' }));
app.use('/uploads', express.static(process.env.UPLOAD_DIR || path.join(__dirname, '../uploads')));

// Routes
app.use('/api/concerts', concertsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/scanner', scannerRouter);
app.use('/api/auth', authRouter);
app.use('/api/organizer', organizerRouter);
app.use('/api/admin', adminRouter);
app.use('/api/locations', locationsRouter);

// Root & Health check
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; background: #07070b; color: #fff; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <h1 style="color: #00f0ff; margin-bottom: 8px;">⚡ SoundWave Pass — Backend API</h1>
      <p style="color: #aaa; margin-bottom: 24px;">Backend server is running on port ${PORT}</p>
      <a href="http://localhost:5173" style="background: #00f0ff; color: #000; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
        👉 ไปที่หน้าเว็บ SoundWave Pass (Port 5173)
      </a>
      <p style="color: #666; font-size: 13px; margin-top: 20px;">Health check: <a href="/api/health" style="color: #ff007f;">/api/health</a></p>
    </div>
  `);
});

// Health check & LINE Bot Test
app.get('/api/line/test', async (req, res) => {
  try {
    const line = require('@line/bot-sdk');
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) {
      return res.status(400).json({ success: false, message: 'LINE_CHANNEL_ACCESS_TOKEN ยังไม่ถูกตั้งค่าใน .env' });
    }
    const client = new line.messagingApi.MessagingApiClient({ channelAccessToken: token.trim() });
    const botInfo = await client.getBotInfo();
    res.json({
      success: true,
      message: '🎉 บอท LINE เชื่อมต่อกับระบบ SoundWave Pass สำเร็จ 100%!',
      bot: {
        name: botInfo.displayName,
        lineId: botInfo.basicId.startsWith('@') ? botInfo.basicId : `@${botInfo.basicId}`,
        userId: botInfo.userId,
        pictureUrl: botInfo.pictureUrl
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'เชื่อมต่อ LINE ไม่สำเร็จ: ' + error.message 
    });
  }
});

app.get(['/api', '/api/health'], (req, res) => {
  res.json({
    status: 'OK',
    project: 'SoundWave Pass Backend API',
    team: 'Team Alpha',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
});

app.listen(PORT, () => {
  console.log(`⚡ [SoundWave Pass Backend] Server running at http://localhost:${PORT}`);
  console.log(`🎸 Health check available at http://localhost:${PORT}/api/health`);
});
