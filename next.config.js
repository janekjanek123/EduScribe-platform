/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure proper extensions
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx'],
  
  // Increase file upload limits for video processing
  experimental: {
    // Increase body size limit for file uploads (default is 1MB)
    serverComponentsExternalPackages: ['ffmpeg-installer'],
  },
  
  // Configure file upload limits
  async headers() {
    return [
      {
        source: '/api/upload-video',
        headers: [
          {
            key: 'Access-Control-Allow-Methods',
            value: 'POST, OPTIONS',
          },
        ],
      },
    ];
  },
  
  // Map API routes properly
  async rewrites() {
    return {
      beforeFiles: [
        // Make sure all API requests are handled by App Router
        {
          source: '/api/:path*',
          destination: '/api/:path*',
        }
      ]
    };
  },
  
  // Set proper output configuration
  output: 'standalone',
  
  // Ensure images are properly handled
  images: {
    domains: ['img.youtube.com', 'i.ytimg.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.ytimg.com',
        pathname: '/**',
      }
    ]
  }
};

module.exports = nextConfig; 