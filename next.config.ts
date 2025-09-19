/** @type {import('next').NextConfig} */
const nextConfig = {
  // Génère .next/standalone (idéal pour Docker)
  output: "standalone",

  // (optionnel) strict mode React
  reactStrictMode: true,

  // (optionnel) si tu utilises app/ et images distantes, etc.
  // images: { remotePatterns: [{ protocol: 'https', hostname: '...' }] },
};

module.exports = nextConfig;
