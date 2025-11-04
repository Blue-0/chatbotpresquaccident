/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // ✅ Laisse passer le build même s'il y a des erreurs ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },

  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
          // ✅ Prévient le clickjacking en empêchant l'iframe
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // ✅ Empêche le navigateur de deviner le type MIME
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // ✅ Contrôle le referrer envoyé lors de la navigation
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // ✅ Content Security Policy - Limite les sources de contenu autorisées
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval requis pour certaines libs
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob:",
              "connect-src 'self' https://n8n.e2i-ia.fr https://api.mistral.ai",
              "media-src 'self' blob:",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          // ✅ Force HTTPS en production
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // ✅ Contrôle les permissions du navigateur
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=()',
          },
        ],
      },
    ]
  },
};

module.exports = nextConfig;
