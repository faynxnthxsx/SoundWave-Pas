const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('soundwaveDesktop', {
  isDesktop: true,
  isProduction: process.argv.includes('--soundwave-production'),
});
