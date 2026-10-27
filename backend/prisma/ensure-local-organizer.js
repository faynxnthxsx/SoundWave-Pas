require('dotenv').config();
const crypto = require('crypto');
const { promisify } = require('util');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const scrypt = promisify(crypto.scrypt);

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('This helper is for local development only. Create production organizers through the deployment seed.');
  }

  const existing = await prisma.organizer.findUnique({ where: { username: 'owner' } });
  if (existing) {
    console.log('Local organizer account already exists; no records were changed.');
    return;
  }

  const password = process.env.SEED_ORGANIZER_PASSWORD || '1234';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  await prisma.organizer.create({
    data: {
      username: 'owner',
      passwordHash: `${salt}:${hash.toString('hex')}`,
      name: 'SoundWave Event Organizer',
    },
  });
  console.log('Created local organizer account "owner".');
}

main()
  .catch((error) => {
    console.error('Could not provision local organizer:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
