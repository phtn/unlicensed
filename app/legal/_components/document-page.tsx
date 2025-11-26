'use client'

import type {LegalDocument} from '@/legal/documents'
import {legalDocuments} from '@/legal/documents'
import {Icon} from '@/lib/icons'
import {Button} from '@heroui/react'
import Link from 'next/link'
import {useState} from 'react'
import {TocDrawer} from './toc-drawer'

interface LegalDocumentPageProps {
  document: LegalDocument
}

export function LegalDocumentPage({document}: LegalDocumentPageProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handlePrint = () => {
    window.print()
  }

  const otherDocuments = legalDocuments.filter(
    (doc) => doc.slug !== document.slug,
  )

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='sticky top-0 z-40 border-b border-border backdrop-blur supports-backdrop-filter:bg-origin/40'>
        <div className='flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-4'>
            <Link
              href='/legal'
              className='inline-flex items-center justify-center rounded-md p-2 hover:bg-muted'
              aria-label='Back to legal documents'>
              <Icon name='chevron-right' className='h-5 w-5' />
            </Link>

            <div>
              <h1 className='text-xl font-medium font-figtree text-foreground tracking-tighter'>
                {document.title}
              </h1>
              <p className='text-sm text-muted-foreground'>
                {document.description}
              </p>
            </div>
          </div>

          <div className='flex items-center space-x-2'>
            <Button
              variant='ghost'
              onPress={handlePrint}
              className='inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium print:hidden'
              aria-label='Print document'>
              <Icon name='arrow-down' className='h-4 w-4' />
              <span className='hidden sm:inline font-figtree opacity-60'>
                Print
              </span>
            </Button>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className='inline-flex items-center justify-center rounded-md p-2 hover:bg-muted lg:hidden'
              aria-label='Toggle table of contents'>
              <Icon name='chevron-right' className='h-5 w-5' />
            </button>
          </div>
        </div>
      </header>

      <div className='flex'>
        {/* TOC Drawer for mobile */}
        <TocDrawer
          isOpen={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          document={document}
        />

        {/* Main content */}
        <main className='flex-1 bg-white'>
          <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
            <nav className='fixed bottom-0 left-0 w-screen backdrop-blur border-t border-border py-4 print:hidden'>
              <div className='flex items-center justify-center space-x-4 '>
                {otherDocuments.map((doc) => (
                  <Link
                    key={doc.slug}
                    href={`/legal/${doc.slug}`}
                    className='min-w-lg group flex items-center justify-between rounded-3xl border p-4 hover:bg-muted/60'>
                    <div>
                      <p className='text-sm text-muted-foreground'>
                        {doc.slug}
                      </p>
                      <p className='font-semibold text-foreground group-hover:text-primary'>
                        {doc.title}
                      </p>
                    </div>
                    <Icon
                      name='chevron-right'
                      className='h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary'
                    />
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </main>

        {/* Desktop TOC Sidebar */}
        <aside className='hidden w-80 md:h-[85lvh] overflow-y-scroll border-l border-border bg-muted/30 p-6 lg:block print:hidden'>
          <div className='sticky top-20'>
            <span>Table of Contents</span>
          </div>
        </aside>
      </div>
    </div>
  )
}
