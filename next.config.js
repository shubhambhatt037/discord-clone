/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil"
    });

    return config;
  },
  images: {
    domains: [
      "uploadthing.com",
      "utfs.io"
    ]
  },
  // Optimize for production
  experimental: {
    serverComponentsExternalPackages: ["pusher"]
  },
  // Enable compression and optimization
  compress: true,
  poweredByHeader: false,
  // Optimize static generation
  trailingSlash: false
}

module.exports = nextConfig