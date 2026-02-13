import withPWAInit from '@ducanh2912/next-pwa'
import createMDX from '@next/mdx'
import { execSync } from 'child_process'
import type { NextConfig } from 'next'

const DEFAULT_SERVER_ACTION_ALLOWED_ORIGINS = [
  'rapidfirenow.com',
  'localhost',
  'rapid-fire-online.vercel.app',
]

const customAllowedOrigins = (
  process.env.NEXT_SERVER_ACTIONS_ALLOWED_ORIGINS ?? ''
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const serverActionAllowedOrigins = Array.from(
  new Set([...DEFAULT_SERVER_ACTION_ALLOWED_ORIGINS, ...customAllowedOrigins]),
)

const sanitizeId = (value: string) => {
  const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, '-')
  return sanitized || 'local-dev'
}

const resolveBuildId = () => {
  const envBuildId = [
    process.env.NEXT_BUILD_ID,
    process.env.NEXT_DEPLOYMENT_ID,
    process.env.GITHUB_SHA,
    process.env.CI_COMMIT_SHA,
    process.env.RAILWAY_GIT_COMMIT_SHA,
    process.env.SOURCE_VERSION,
  ]
    .map((value) => value?.trim())
    .find(Boolean)

  if (envBuildId) return sanitizeId(envBuildId)

  try {
    return sanitizeId(execSync('git rev-parse HEAD').toString().trim())
  } catch {
    return 'local-dev'
  }
}

const buildId = resolveBuildId()
const deploymentId = sanitizeId(
  process.env.NEXT_DEPLOYMENT_ID?.trim() || buildId,
)

if (
  process.env.NODE_ENV === 'production' &&
  !process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
) {
  throw new Error(
    'Missing NEXT_SERVER_ACTIONS_ENCRYPTION_KEY in production. Self-hosted Server Actions require a stable key across all app instances.',
  )
}

const withPWA = withPWAInit({
  dest: 'public',
  // Prevent stale client navigation caches from holding old Server Action ids after deploys.
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
})

const nextConfig: NextConfig = {
  deploymentId,
  experimental: {
    serverActions: {
      allowedOrigins: serverActionAllowedOrigins,
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
    return buildId
  },
  async headers() {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' accounts.google.com apis.google.com *.moonpay.com *.wert.io polygonscan.com *.transak.com *.kryptonim.com *.hel.io embed.hel.io *.matic.quicknode.pro tiplink.io *.helius-rpc.com *.walletconnect.com api.web3modal.org rpc.walletconnect.org *.coinbase.com *.rapidfirenow.com static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline' embed.hel.io rpc.walletconnect.org *.reown.com firestore.googleapis.com api.web3modal.org *.rapidfirenow.com",
      "img-src 'self' data: blob: https: images.unsplash.com res.cloudinary.com *.reown.com *.rapidfirenow.com",
      "font-src 'self' data: *.reown.com",
      "connect-src 'self' *.convex.cloud wss://*.convex.cloud *.paygate.to *.firebaseio.com *.googleapis.com *.firebaseapp.com *.moonpay.com *.wert.io polygonscan.com *.transak.com *.kryptonim.com *.hel.io embed.hel.io *.alchemy.com *.g.alchemy.com *.matic.quicknode.pro tiplink.io *.helius-rpc.com *.walletconnect.com  rpc.walletconnect.org  *.coinbase.com api.web3modal.org pulse.walletconnect.org *.rapidfirenow.com",
      "frame-src 'self' accounts.google.com *.paygate.to *.firebaseapp.com *.moonpay.com *.wert.io polygonscan.com *.transak.com *.kryptonim.com *.hel.io embed.hel.io *.matic.quicknode.pro tiplink.io *.helius-rpc.com *.walletconnect.com  rpc.walletconnect.org  *.coinbase.com *.rapidfirenow.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' *.paygate.to *.kryptonim.com *.moonpay.com *.wert.io *.transak.com *.matic.quicknode.pro tiplink.io *.helius-rpc.com *.walletconnect.com *.rapidfirenow.com",
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
