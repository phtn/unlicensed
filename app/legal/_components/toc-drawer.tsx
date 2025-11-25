'use client'

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import type {LegalDocument} from '@/legal/documents'

interface TocDrawerProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  document: LegalDocument | undefined
}

export function TocDrawer({
  isOpen,
  onOpenChange,
  document: doc,
}: TocDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Table of Contents</DrawerTitle>
        </DrawerHeader>
        <nav className='space-y-2 px-4 pb-6 text-sm'>
          {doc?.headings?.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault()
                const element = document.getElementById(heading.id)
                if (element) {
                  element.scrollIntoView({behavior: 'smooth'})
                }
                onOpenChange(false)
              }}
              className={`block rounded px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${
                heading.level === 2 ? 'font-medium' : 'ml-4'
              }`}>
              {heading.text}
            </a>
          ))}
        </nav>
      </DrawerContent>
    </Drawer>
  )
}
