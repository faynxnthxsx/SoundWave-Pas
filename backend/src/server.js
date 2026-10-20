require('dotenv').config();
const express = require('express');
const cors = require('cors');

const concertsRouter = require('./routes/concerts');
const bookingsRouter = require('./routes/bookings');
const ticketsRouter = require('./routes/tickets');
const scannerRouter = require('./routes/scanner');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/concerts', concertsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/scanner', scannerRouter);

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
  res.status(500).json({ success: false, message: 'Server Internal Error' });
});

app.listen(PORT, () => {
  console.log(`⚡ [SoundWave Pass Backend] Server running at http://localhost:${PORT}`);
  console.log(`🎸 Health check available at http://localhost:${PORT}/api/health`);
});
