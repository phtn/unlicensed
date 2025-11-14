import {Footer} from '@/components/ui/footer'
import {ProvidersCtxProvider} from '@/ctx'
import type {Metadata} from 'next'
import {
  Figtree,
  Fugaz_One,
  Geist,
  Geist_Mono,
  Space_Grotesk,
} from 'next/font/google'
import './globals.css'

const figtree = Figtree({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
})
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})
const space = Space_Grotesk({
  variable: '--font-space',
  subsets: ['latin'],
  display: 'swap',
})
const fugaz = Fugaz_One({
  variable: '--font-fugaz',
  weight: ['400'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Unlicensed | Guaranteed Illegal',
  description:
    'Discover elevated THC flower, edibles, concentrates, and drinks curated for modern rituals.',
  keywords: [
    'cannabis',
    'THC',
    'flower',
    'edibles',
    'concentrates',
    'dispensary',
    'Hyfe',
  ],
  creator: 're-up.ph',
  openGraph: {
    title: 'Unlicensed | Guaranteed Illegal',
    description:
      'Modern cannabis commerce with curated drops, immersive product storytelling, and delightful UX.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unlicensed | Guaranteed Illegal',
    description:
      'Discover elevated THC flower, edibles, concentrates, and drinks curated for modern rituals.',
  },
  icons: [
    {
      rel: 'icon',
      url: '/svg/logo.svg',
      sizes: 'any',
    },
  ],
}

/**
 * Root Layout
 * 
 * This layout wraps all pages and includes parallel route slots:
 * - @navbar: Navigation bar slot (rendered via navbar prop)
 * - children: Main page content
 * 
 * IMPORTANT: Both navbar and children are rendered within the same
 * ProvidersCtxProvider, which includes ConvexProvider. This ensures:
 * - Both slots share the same Convex client instance
 * - Convex queries are reactive across all slots
 * - Mutations in one slot automatically trigger query updates in other slots
 * - Cart badge in navbar updates when items are added from product pages
 * 
 * Parallel Routes in Next.js:
 * - Parallel routes allow rendering multiple pages simultaneously
 * - Slots are defined using @folder syntax (e.g., @navbar)
 * - Each slot can have its own loading, error, and default files
 * - All slots share the same React context (including ConvexProvider)
 */
export default function RootLayout({
  children,
  navbar,
}: Readonly<{
  children: React.ReactNode
  navbar?: React.ReactNode
}>) {
  return (
    <html lang='en' className='dark' data-theme='dark' suppressHydrationWarning>
      <body
        className={`${figtree.variable} ${fugaz.variable} ${space.variable} ${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased font-sans`}>
        {/* 
          ProvidersCtxProvider wraps ConvexProvider, which enables reactivity
          across all parallel route slots (navbar, children, etc.)
        */}
        <ProvidersCtxProvider>
          <div className='relative flex min-h-screen flex-col overflow-x-hidden bg-background'>
            <div className='pointer-events-none absolute inset-0 -z-20 backdrop-primary' />
            <div className='pointer-events-none absolute inset-0 -z-10 backdrop-secondary' />
            <div className='relative z-10 flex min-h-screen flex-col'>
              {/* Navbar slot - shares Convex context with children */}
              {navbar}
              {/* Main content - shares Convex context with navbar */}
              <div className='relative flex-1 mt-12'>{children}</div>
              <Footer />
            </div>
          </div>
        </ProvidersCtxProvider>
      </body>
    </html>
  )
}
