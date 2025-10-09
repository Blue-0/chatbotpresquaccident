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
        ],
      },
    ]
  },
};

module.exports = nextConfig;
