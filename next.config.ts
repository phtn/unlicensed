import createMDX from '@next/mdx'
import type {NextConfig} from 'next'
import {execSync} from 'child_process'

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  generateBuildId: async () => {
    try {
      return execSync('git rev-parse HEAD').toString().trim()
    } catch {
      return 'build-' + Date.now()
    }
  },
  async headers() {
    return [
      {
        source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ]
  },
}

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
  options: {
    remarkPlugins: ['remark-gfm', 'remark-toc'],
    rehypePlugins: ['rehype-slug'],
  },
})

export default withMDX(nextConfig)
