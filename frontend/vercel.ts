const backendUrl = (process.env.RENDER_API_URL || 'https://soundwave-pass-api.onrender.com').replace(/\/+$/, '');

export default {
  framework: 'vite',
  installCommand: 'npm ci',
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  rewrites: [
    { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
    { source: '/uploads/:path*', destination: `${backendUrl}/uploads/:path*` },
    { source: '/:path*', destination: '/index.html' },
  ],
};
