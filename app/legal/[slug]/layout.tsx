'use client'
import {useHeadings} from '@/hooks/use-headings'
import {legalDocuments} from '@/legal/documents'
import {Icon} from '@/lib/icons'
import {Button} from '@heroui/react'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {ReactNode, useState} from 'react'
import {SpaceX} from '../_components/spacex'
import {TocDrawer} from '../_components/toc-drawer'

interface LegalDocumentLayoutProps {
  children?: ReactNode
}

export default function LegalDocumentLayout({
  children,
}: LegalDocumentLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const endpoint = usePathname().split('/').pop()
  const headings = useHeadings()
  const handlePrint = () => {
    window.print()
  }

  const otherDocs = legalDocuments.filter((doc) => doc.slug !== endpoint)
  const currentDoc = legalDocuments.find((doc) => doc.slug === endpoint)

  // Create document with headings for TOC
  const documentWithHeadings = currentDoc
    ? {...currentDoc, headings}
    : undefined

  return (
    <div className='h-screen bg-background'>
      {/* Header */}
      <header className='absolute w-full top-0 z-40 border-b border-border backdrop-blur-2xl supports-backdrop-filter:bg-origin/40'>
        <div className='flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-2 md:gap-4'>
            <Link
              href='/legal'
              className='inline-flex items-center justify-center rounded-md p-1 hover:bg-muted/40'
              aria-label='Back to legal documents'>
              <Icon name='chevron-left' className='size-5 text-white' />
            </Link>

            <div>
              <h1 className='text-xs text-white sm:text-sm md:text-lg capitalize font-medium font-figtree tracking-tighter _max-w-[8ch] md:leading-5 leading-4'>
                {endpoint?.split('-').join(' ')}
              </h1>
            </div>
          </div>

          <Icon
            name='rapid-fire'
            className='text-white h-8 w-16 md:h-12 md:w-36'
          />

          <div className='flex items-center space-x-4'>
            <Button
              size='sm'
              variant='solid'
              onPress={handlePrint}
              className='bg-transparent font-figtree text-white items-center gap-1 rounded-md px-3 md:px-4 py-2 text-sm font-medium print:hidden hover:bg-muted/40'
              aria-label='Print document'>
              Print<span className='hidden md:flex'>this document</span>
            </Button>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className='inline-flex items-center justify-center rounded-md p-1 hover:bg-muted/40 lg:hidden'
              aria-label='Toggle table of contents'>
              <Icon name='chevron-right' className='size-5' />
            </button>
          </div>
        </div>
      </header>

      <div className='flex'>
        {/* TOC Drawer for mobile */}
        <TocDrawer
          isOpen={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          document={documentWithHeadings}
        />

        {/* Main content */}
        <main className='h-fit flex-1 mx-auto max-w-260 px-4 sm:px-6 lg:px-8 bg-white dark:bg-background'>
          {children}
        </main>

        <aside className='absolute left-0 hidden w-96 md:h-screen overflow-y-scroll border-r border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-background/60 p-6 lg:block print:hidden'>
          <SpaceX />
          <div className='sticky top-8 font-figtree'>
            <div className='mb-8 opacity-70 underline-offset-4 underline-[0.33px] decoration-dotted dark:decoration-slate-400/60 px-2'>
              Resources
            </div>

            {otherDocs.map((doc) => (
              <Link
                key={doc.slug}
                href={`/legal/${doc.slug}`}
                className='w-fit group flex items-center justify-between hover:bg-muted/20 px-2 rounded-md transition-all mb-2 md:mb-3'>
                <div>
                  <p className='font-semibold text-foreground'>{doc.title}</p>
                </div>
              </Link>
            ))}
          </div>

          <SpaceX />
        </aside>

        {/* Desktop TOC Sidebar */}
        <aside className='absolute right-0 hidden w-96 md:h-screen overflow-y-scroll border-l border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-background/60 lg:block print:hidden p-6'>
          <SpaceX />
          <div className='sticky top-8 font-figtree'>
            <div className='mb-8 opacity-70'>Table of Contents</div>

            <nav className='space-y-3 text-sm'>
              {headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    const element = document.getElementById(heading.id)
                    if (element) {
                      element.scrollIntoView({behavior: 'smooth'})
                    }
                  }}
                  className={`block truncate hover:bg-muted/20 px-2 rounded-md w-fit font-figtree tracking-tight py-1 hover:text-foreground text-muted-foreground transition-colors ${
                    heading.level === 2
                      ? 'font-medium'
                      : heading.level === 3
                        ? 'ml-4'
                        : heading.level === 4
                          ? 'ml-6'
                          : ''
                  }`}>
                  <span className=''>{heading.text}</span>
                </a>
              ))}
            </nav>
          </div>
          <SpaceX />
        </aside>
      </div>
    </div>
  )
}
