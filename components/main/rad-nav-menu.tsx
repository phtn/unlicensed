'use client'

import {useMobile} from '@/hooks/use-mobile'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {AnimatePresence, motion} from 'motion/react'
import Link from 'next/link'
import {useCallback, useLayoutEffect, useMemo, useRef, useState} from 'react'
import {HyperList} from '../expermtl/hyper-list'

export interface NavMenuCategory {
  slug: string
  name: string
}

/** Optional submenu link for a category. Add more later for full submenus. */
export interface NavMenuSubItem {
  id: string
  label: string
  href?: string
  description?: string
}

const VIEWPORT_TRANSITION = {
  initial: {opacity: 0, y: 4},
  animate: {opacity: 1, y: 0},
  exit: {opacity: 0, y: -2},
  transition: {duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94]},
} as const

interface InnerMenuProps {
  items: Array<NavMenuCategory>
  /** Optional submenu per category. Key = category slug. Empty/missing = no submenu yet. */
  subItemsBySlug?: Partial<Record<string, NavMenuSubItem[]>>
}

export const InnerMenu = ({items, subItemsBySlug = {}}: InnerMenuProps) => {
  const [activeSlug, setActiveSlug] = useState<string | null>(() =>
    items.length ? items[0].slug : null,
  )
  const listRef = useRef<HTMLUListElement>(null)
  const active = activeSlug ?? items[0]?.slug ?? null
  const activeItem = items.find((i) => i.slug === active)

  const setIndicatorToButton = useCallback((button: HTMLElement | null) => {
    const ul = listRef.current
    if (!ul || !button) return
    const ulRect = ul.getBoundingClientRect()
    const btnRect = button.getBoundingClientRect()
    const left = btnRect.left - ulRect.left + ul.scrollLeft
    ul.style.setProperty('--hovered-category-left', `${left}px`)
    ul.style.setProperty('--hovered-category-width', `${btnRect.width}px`)
  }, [])

  useLayoutEffect(() => {
    const ul = listRef.current
    if (!ul) return
    const activeBtn = ul.querySelector<HTMLElement>('[data-active]')
    setIndicatorToButton(activeBtn)
  }, [active, setIndicatorToButton])

  if (!items.length) return null

  return (
    <div
      className='flex w-full flex-row gap-2 md:flex-col md:gap-2'
      onMouseLeave={() => setActiveSlug(active)}
      role='navigation'
      aria-label='Categories'>
      {/* Category triggers: column on mobile (left), single row on desktop (top) */}
      <ul
        ref={listRef}
        className={cn(
          'flex list-none flex-col gap-2 p-0 shrink-0 border border-border/60 rounded-xs overflow-hidden md:border-0 md:rounded-none md:overflow-visible',
          'w-34 min-h-0 md:w-full md:flex-row md:flex-nowrap md:gap-3',
          'relative',
        )}
        role='list'
        style={
          {
            '--hovered-category-left': '0px',
            '--hovered-category-width': '0px',
          } as React.CSSProperties
        }>
        {items.map((item) => (
          <li key={item.slug} className='list-none md:shrink-0'>
            <button
              type='button'
              className={cn(
                'group/cat flex h-auto w-full items-center justify-between border border-border/60 text-left text-sm font-semibold shadow-sm transition-colors duration-150 ease-out',
                'hover:border-border hover:text-accent-foreground hover:shadow-xs px-6 py-4 md:py-3',
                'focus-visible:ring-2 focus-visible:ring-ring/50 rounded-none dark:bg-black dark:text-white',
                'border-none dark:data-active:text-white bg-sidebar/30',
                active === item.slug &&
                  'border-border shadow bg-transparent dark:bg-transparent!',
              )}
              onMouseEnter={(e) => {
                setActiveSlug(item.slug)
                setIndicatorToButton(e.currentTarget)
              }}
              onFocus={(e) => {
                setActiveSlug(item.slug)
                setIndicatorToButton(e.currentTarget)
              }}
              aria-current={active === item.slug ? 'true' : undefined}
              data-active={active === item.slug || undefined}>
              <span className='truncate capitalize text-base font-clash'>
                {item.name}
              </span>
              <Icon
                name='down-caret'
                className={cn(
                  'size-3.5 shrink-0 opacity-40 translate-x-0.5 -translate-y-0.5 transition-transform duration-300 ease-out scale-50 -rotate-45 md:rotate-0',
                  active === item.slug &&
                    'scale-75 md:scale-90 opacity-100 text-brand translate-y-0.0',
                )}
                aria-hidden
              />
            </button>
          </li>
        ))}

        <div
          id='indicator'
          className='absolute top-1/2 left-0 z-[-1] h-10 w-(--hovered-category-width) translate-x-(--hovered-category-left) -translate-y-1/2 bg-sidebar dark:bg-dark-table transition-all duration-200 ease-in-out hidden md:block'
        />
      </ul>

      {/* Single viewport: one category's content at a time — right column on mobile, below categories on desktop */}
      <div
        className='flex min-h-32 min-w-0 flex-1 overflow-hidden rounded-xs border border-border/60 md:py-2 md:pl-2 pr-2.5 dark:bg-alum/60 md:min-h-0 md:min-w-40'
        role='region'
        aria-label='Category links'>
        <AnimatePresence mode='wait' initial={false}>
          {activeItem && (
            <motion.div
              key={activeItem.slug}
              {...VIEWPORT_TRANSITION}
              className='flex list-none flex-col gap-0.5 md:px-1 py-0.5  w-full'
              role='presentation'>
              <CategoryViewportContent
                item={activeItem}
                subItems={subItemsBySlug[activeItem.slug]}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

interface CategoryViewportContentProps {
  item: NavMenuCategory
  subItems?: NavMenuSubItem[]
}

function CategoryViewportContent({
  item,
  subItems = [],
}: CategoryViewportContentProps) {
  const isMobile = useMobile()
  const categoryHref = `/lobby/category/${item.slug}`
  const allSubItems = useMemo(
    () => [
      {
        id: 'all',
        label: `All ${item.name}`,
        href: categoryHref,
        description: undefined,
      },
      ...subItems,
    ],
    [item.name, categoryHref, subItems],
  )

  return (
    <>
      <div
        className='my-1 border-t border-border/60'
        role='separator'
        aria-hidden
      />
      <HyperList
        data={allSubItems}
        component={SubItem}
        direction={isMobile ? 'right' : 'down'}
        container='flex flex-col md:flex-row gap-1.5 md:gap-0.5'
        withExitAnimation
        duration={0.2}
      />
    </>
  )
}

const SubItem = (item: NavMenuSubItem) => {
  return (
    <Link
      href={item.href ?? '#'}
      className={cn(
        'flex shrink-0 items-center px-3 py-2 outline-none border-b-2 border-b-transparent',
        'dark:hover:bg-dark-table/50 hover:border-brand capitalize group',
        'focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
        'transition-colors duration-75 ease-in-out',
        'text-sm md:text-base font-clash',
      )}>
      <span
        className={cn(
          'opacity-60 dark:group-hover:opacity-100 group-hover:font-medium',
          {
            'opacity-100 font-bold': item.id === 'all',
          },
        )}>
        {item.label}
      </span>
    </Link>
  )
}
