import {ProvidersCtxProvider} from '@/ctx'
import type {Metadata} from 'next'
import {
  Bakbak_One as BakbakOne,
  Figtree,
  Fugaz_One,
  Geist,
  Geist_Mono,
  Space_Grotesk,
} from 'next/font/google'
import {AgeConfirmationModal} from './_components/age-confirmation-modal'
import {ConditionalNavbar} from './_components/conditional-navbar'
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

const bone = BakbakOne({
  variable: '--font-bone',
  weight: ['400'],
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Rapid Fire',
    template: '%s | Rapid Fire',
  },
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
  authors: [{name: 'xpriori'}, {name: 'quimpoi'}],
  creator: 're-up.ph',
  publisher: 're-up.ph',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://rapid-fire-online.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Rapid Fire',
    description:
      'Modern cannabis commerce with curated drops, immersive product storytelling, and delightful UX.',
    type: 'website',
    url: 'https://rapid-fire-online.vercel.app',
    siteName: 'Rapid Fire',
    images: [
      {
        url: '/rf-og.png',
        width: 2304,
        height: 1328,
        alt: 'Rapid Fire',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rapid Fire',
    description:
      'Discover elevated THC flower, edibles, concentrates, and drinks curated for modern rituals.',
    images: [
      {
        url: '/rf-x.png',
        width: 2272,
        height: 1392,
        alt: 'Rapid Fire',
      },
    ],
  },
  icons: [
    {
      rel: 'icon',
      url: '/svg/rf-icon-hot-pink.svg',
      sizes: 'any',
    },
  ],

  referrer: 'strict-origin-when-cross-origin',
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
        className={`${bone.variable} ${figtree.variable} ${fugaz.variable} ${space.variable} ${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased font-sans`}>
        {/*
          ProvidersCtxProvider wraps ConvexProvider, which enables reactivity
          across all parallel route slots (navbar, children, etc.)
        */}
        <ProvidersCtxProvider>
          {/*<div className='relative flex min-h-screen flex-col overflow-x-hidden bg-background'>
            <div className='pointer-events-none absolute inset-0 -z-20 backdrop-primary' />
            <div className='pointer-events-none absolute inset-0 -z-10 backdrop-secondary' />
            <div className='relative z-10 flex min-h-screen flex-col'>*/}
          {/* Age confirmation modal - appears on first visit */}
          <AgeConfirmationModal />
          {/* Navbar slot - shares Convex context with children */}
          <ConditionalNavbar navbar={navbar} />
          {/* Main content - shares Convex context with navbar */}
          <div className='relative bg-background'>{children}</div>
          {/*<Footer />*/}
          {/*</div>
          </div>*/}
        </ProvidersCtxProvider>
      </body>
    </html>
  )
}
