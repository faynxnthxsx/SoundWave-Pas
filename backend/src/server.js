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

// Health check
app.get('/api/health', (req, res) => {
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
