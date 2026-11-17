const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('soundwaveDesktop', {
  isDesktop: true,
  isProduction: process.argv.includes('--soundwave-production'),
  startGoogleOAuth: (clientId) => ipcRenderer.invoke('soundwave:google-oauth', clientId),
  cancelGoogleOAuth: () => ipcRenderer.invoke('soundwave:google-oauth-cancel'),
});
