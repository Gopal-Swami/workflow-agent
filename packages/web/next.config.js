/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',

  experimental: {
    // Needed for Temporal client in API routes (native modules)
    serverComponentsExternalPackages: ['@temporalio/client'],
  },
};

module.exports = nextConfig;
