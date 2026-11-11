const { execSync, spawn } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForDatabaseAndPushSchema() {
  const maxAttempts = 20;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔄 [Docker Entrypoint] Pushing Prisma schema to MySQL (attempt ${attempt}/${maxAttempts})...`);
      execSync('npx prisma db push --skip-generate --accept-data-loss', { stdio: 'inherit' });
      console.log('✅ [Docker Entrypoint] Prisma schema synced with MySQL.');
      return;
    } catch (err) {
      console.warn(`⏳ [Docker Entrypoint] Database not ready yet (${err.message}). Retrying in 3s...`);
      await sleep(3000);
    }
  }
  throw new Error('Could not connect to MySQL database after multiple attempts.');
}

async function seedIfEmpty() {
  const prisma = new PrismaClient();
  try {
    const concertCount = await prisma.concert.count();
    if (concertCount === 0) {
      console.log('🌱 [Docker Entrypoint] Database is empty — importing initial data from shared-data.json...');
      execSync('node prisma/import-data.js', { stdio: 'inherit' });
    } else {
      console.log(`🎸 [Docker Entrypoint] Database already has ${concertCount} concerts — skipping initial seed.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function start() {
  try {
    await waitForDatabaseAndPushSchema();
    await seedIfEmpty();
    console.log('📊 [Docker Entrypoint] Starting Prisma Studio Database Viewer at http://localhost:5555 ...');
    const studio = spawn('npx', ['prisma', 'studio', '--port', '5555', '--browser', 'none'], {
      stdio: 'ignore',
      detached: true,
    });
    studio.unref();
    console.log('🚀 [Docker Entrypoint] Starting SoundWave Pass Backend API...');
    require('./src/server.js');
  } catch (err) {
    console.error('❌ [Docker Entrypoint] Fatal startup error:', err);
    process.exit(1);
  }
}

start();
