const { PrismaClient } = require('@prisma/client');

// Global singleton pattern to prevent multiple instances across hot reloads & serverless warm containers
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prismaInstance ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

globalForPrisma.prismaInstance = prisma;

module.exports = prisma;
