import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Native shells (Capacitor / Electron production) are not served by the backend,
// so relative /api and /uploads calls try local backend (localhost:5000) first on Desktop,
// then fall back to the cloud server (Vercel).
const LOCAL_API_BASE = 'http://localhost:5000'
const NATIVE_API_BASE = 'https://soundwave-pas.vercel.app'
const isDesktopShell = typeof window !== 'undefined' && Boolean(window.soundwaveDesktop?.isDesktop)
const isNativeShell =
  typeof window !== 'undefined' &&
  (Boolean(window.Capacitor?.isNativePlatform?.()) || Boolean(window.soundwaveDesktop?.isProduction))

if (isNativeShell) {
  const originalFetch = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    if (typeof input === 'string' && (input.startsWith('/api') || input.startsWith('/uploads'))) {
      if (isDesktopShell) {
        try {
          const localRes = await originalFetch(LOCAL_API_BASE + input, init)
          if (localRes.ok || localRes.status < 500) {
            return localRes
          }
        } catch {
          // Local backend not running, fall back to cloud API
        }
      }
      return originalFetch(NATIVE_API_BASE + input, init)
    }
    return originalFetch(input, init)
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
