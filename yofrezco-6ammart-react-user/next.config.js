const nextConfig = {
  reactStrictMode: true,
  // Enable compression for better performance
  compress: true,
  // Enable SWC minification (faster than Terser)
  swcMinify: true,
  experimental: {
    swcPlugins: [],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Keep error and warn, remove log, info, debug, etc.
    } : false,
  },
  images: {
    // Optimize images
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year cache - prevents constant re-downloads
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'portal.yofrezco.com', // Your main image domain
        pathname: '/**',
      },
      {
        protocol: 'http', // Fallback for development
        hostname: '**',
        pathname: '/**',
      },
    ],
  },
  // Enable production optimizations
  productionBrowserSourceMaps: false,
  // Optimize font loading
  optimizeFonts: true,
};

module.exports = nextConfig;



// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   images: {
//     domains: [
//       "bjorn66.com",
//       "6ammart-test.6amdev.xyz",
//       "192.168.50.168",
//       "6ammart-dev.6amdev.xyz",
//     ], // Add the domain here
//   },
// };
//
// module.exports = nextConfig;
