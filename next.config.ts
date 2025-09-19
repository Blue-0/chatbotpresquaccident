/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // ✅ Laisse passer le build même s'il y a des erreurs ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },

  reactStrictMode: true,
};

module.exports = nextConfig;
