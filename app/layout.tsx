import {ProvidersCtxProvider} from '@/ctx'
import type {Metadata, Viewport} from 'next'
import {
  Bakbak_One as BakbakOne,
  Figtree,
  Fugaz_One,
  Geist,
  Geist_Mono,
  Nunito_Sans as NunitoSans,
  Space_Grotesk,
} from 'next/font/google'
import {AgeConfirmationModal} from './_components/age-confirmation-modal'
import {ConditionalNavbar} from './_components/conditional-navbar'
import {EmailLinkHandler} from './_components/email-link-handler'
import {ScreenDimensionsTracker} from './_components/screen-dimensions-tracker'
import './globals.css'

const figtree = Figtree({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
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

const nito = NunitoSans({
  variable: '--font-nito',
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
  applicationName: 'Rapid Fire',
  appleWebApp: {
    capable: true,
    title: 'Rapid Fire',
    statusBarStyle: 'default',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://rapidfirenow.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Rapid Fire',
    description:
      'Modern cannabis commerce with curated drops, immersive product storytelling, and delightful UX.',
    type: 'website',
    url: 'https://rapidfirenow.com',
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
      url: '/svg/rf-icon-2.svg',
      sizes: 'any',
    },
    {
      rel: 'icon',
      url: '/icons/icon-192x192.png',
      sizes: '192x192',
    },
    {
      rel: 'apple-touch-icon',
      url: '/icons/apple-touch-icon.png',
    },
  ],

  referrer: 'strict-origin-when-cross-origin',
}

export const viewport: Viewport = {
  themeColor: '#1a1a1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${nito.variable} ${bone.variable} ${figtree.variable} ${fugaz.variable} ${space.variable} ${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        <ProvidersCtxProvider>
          <EmailLinkHandler />
          <ScreenDimensionsTracker />
          <AgeConfirmationModal />
          <ConditionalNavbar navbar={navbar} />
          {children}
        </ProvidersCtxProvider>
      </body>
    </html>
  )
}
