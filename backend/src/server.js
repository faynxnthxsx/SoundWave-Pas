require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`⚡ [SoundWave Pass Backend] Server running at http://localhost:${PORT}`);
  console.log(`🎸 Health check available at http://localhost:${PORT}/api/health`);
});
