import withPWAInit from '@ducanh2912/next-pwa'
import createMDX from '@next/mdx'
import {execSync} from 'child_process'
import type {NextConfig} from 'next'

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
})

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'rapidfirenow.com',
        'localhost',
        'rapid-fire-online.vercel.app',
      ],
    },
  },
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
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' accounts.google.com apis.google.com *.moonpay.com *.wert.io polygonscan.com *.transak.com *.kryptonim.com *.hel.io embed.hel.io *.matic.quicknode.pro tiplink.io *.helius-rpc.com",
      "style-src 'self' 'unsafe-inline'  embed.hel.io",
      "img-src 'self' data: blob: https: images.unsplash.com res.cloudinary.com",
      "font-src 'self' data:",
      "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud *.paygate.to *.firebaseio.com *.googleapis.com *.firebaseapp.com *.moonpay.com *.wert.io polygonscan.com *.transak.com *.kryptonim.com *.hel.io embed.hel.io *.alchemy.com *.g.alchemy.com *.matic.quicknode.pro tiplink.io *.helius-rpc.com",
      "frame-src 'self' accounts.google.com *.paygate.to *.firebaseapp.com *.moonpay.com *.wert.io polygonscan.com *.transak.com *.kryptonim.com *.hel.io embed.hel.io *.matic.quicknode.pro tiplink.io *.helius-rpc.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' *.paygate.to *.kryptonim.com *.moonpay.com *.wert.io *.transak.com *.matic.quicknode.pro tiplink.io *.helius-rpc.com",
    ].join('; ')

    return [
      {
        source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
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

export default withPWA(withMDX(nextConfig))
