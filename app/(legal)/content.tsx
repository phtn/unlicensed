'use client'

import {IconName} from '@/lib/icons'
import {Card, CardHeader} from '@heroui/react'
import Link from 'next/link'
import {useMemo} from 'react'

interface LegalDocument {
  slug: string
  title: string
  description: string
  icon: IconName
}

export const Content = () => {
  const documents = useMemo(
    () =>
      [
        {
          slug: 'terms-of-use',
          title: 'Terms of Use',
          description: 'Our terms for using this website.',
          icon: 'minus',
        },
        {
          slug: 'privacy-policy',
          title: 'Privacy Policy',
          description: 'How we manage your information',
          icon: 'minus',
        },
        {
          slug: 'purchase-agreement',
          title: 'Purchase Agreement',
          description: 'Policies regarding purchases and returns',
          icon: 'bag-light',
        },
      ] as LegalDocument[],
    [],
  )

  return (
    <main className='min-h-screen bg-background fontfont-figtree'>
      <div className='mx-auto max-w-6xl px-4 py-4 md:py-16 sm:px-6 lg:px-8'>
        <div className='max-w-5xl mx-auto mb-4 md:mb-12'>
          <div className='w-fit mb-2 md:mt-20 font-bold text-foreground tracking-tight'>
            <h1 className='font-figtree text-3xl md:text-4xl tracking-tight'>
              Legal Resources
            </h1>
          </div>

          <p className='text-sm md:text-base'>
            Access our terms, privacy, and purchase agreement.
          </p>
        </div>

        <div className='grid gap-6 md:grid-cols-3'>
          {documents.map((doc) => (
            <Link key={doc.slug} href={`/${doc.slug}`}>
              <Card
                shadow='sm'
                className='dark:bg-origin rounded-4xl md:py-8 md:px-4 h-44 md:h-40 flex flex-col justify-center space-y-2'>
                <CardHeader>
                  <div className='h-full md:h-20 flex flex-col justify-center font-figtree'>
                    <div className='md:text-2xl tracking-tight mb-1 capitalize font-bold'>
                      {doc.slug.split('-').join(' ')}
                    </div>
                    <p className='opacity-60'>{doc.description}</p>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
