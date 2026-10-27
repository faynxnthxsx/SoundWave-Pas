const backendUrl = process.env.RENDER_API_URL?.replace(/\/+$/, '');

if (!backendUrl) {
  throw new Error('Set RENDER_API_URL in the Vercel project environment before deploying.');
}

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
