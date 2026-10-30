const backendUrl = process.env.RENDER_API_URL?.replace(/\/+$/, '');

export default {
  framework: 'vite',
  installCommand: 'npm ci',
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  rewrites: backendUrl
    ? [
        { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
        { source: '/uploads/:path*', destination: `${backendUrl}/uploads/:path*` },
        { source: '/:path*', destination: '/index.html' },
      ]
    : [
        { source: '/api/:path*', destination: '/api/index.js' },
        { source: '/:path*', destination: '/index.html' },
      ],
};
