import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  turbopack: { root: __dirname },
  devIndicators: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/images/**',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/newhome', destination: '/', permanent: true },
      { source: '/instructor-application', destination: '/apply/trainer', permanent: false },
      { source: '/trainer-sign-up-agreement', destination: '/apply/trainer', permanent: false },
      { source: '/trainer-sign-up-details', destination: '/apply/trainer', permanent: false },
      { source: '/donate', destination: '/donate-to-empowerment/', permanent: true },
      { source: '/self-defense-training', destination: '/training/', permanent: true },
      { source: '/self-defense-training-offered', destination: '/training/', permanent: true },
    ]
  },
}

export default nextConfig
