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
  title: 'Hyfe Goods | Modern THC Marketplace',
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
  creator: 'Hyfe Studios',
  openGraph: {
    title: 'Hyfe Goods | Modern THC Marketplace',
    description:
      'Modern cannabis commerce with curated drops, immersive product storytelling, and delightful UX.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hyfe Goods',
    description:
      'Discover elevated THC flower, edibles, concentrates, and drinks curated for modern rituals.',
  },
}

export default function RootLayout({
  children,
  navbar,
}: Readonly<{
  children: React.ReactNode
  navbar: React.ReactNode
}>) {
  return (
    <html lang='en' className='dark' data-theme='dark' suppressHydrationWarning>
      <body
        className={`${figtree.variable} ${fugaz.variable} ${space.variable} ${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased font-sans`}>
        <ProvidersCtxProvider>
          <div className='relative flex min-h-screen flex-col overflow-x-hidden bg-background'>
            <div className='pointer-events-none absolute inset-0 -z-20 backdrop-primary' />
            <div className='pointer-events-none absolute inset-0 -z-10 backdrop-secondary' />
            <div className='relative z-10 flex min-h-screen flex-col'>
              {navbar}
              <div className='relative flex-1 mt-12'>{children}</div>
              <Footer />
            </div>
          </div>
        </ProvidersCtxProvider>
      </body>
    </html>
  )
}
