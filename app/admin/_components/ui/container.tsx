'use client'

import {useMobile} from '@/hooks/use-mobile'
import {useSwipeRight} from '@/hooks/use-swipe-right'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {forwardRef, ReactNode, useMemo, useRef} from 'react'
import {useSettingsPanel} from './settings'
import {SidebarTrigger, useSidebar} from './sidebar'

interface WrappedContentProps {
  children: ReactNode
  toolbar?: ReactNode
  withPanel?: boolean
}

export const WrappedContent = ({
  children,
  toolbar,
  withPanel,
}: WrappedContentProps) => {
  const sidebarState = useSidebar()
  const {
    isMobile: isSidebarMobile,
    open: sidebarOpenDesktop,
    openMobile: sidebarOpenMobile,
    setOpen: setSidebarOpenDesktop,
    setOpenMobile: setSidebarOpenMobile,
  } = sidebarState
  const swipeAreaRef = useRef<HTMLDivElement>(null)

  // Use the appropriate state based on mobile/desktop
  const sidebarOpen = isSidebarMobile ? sidebarOpenMobile : sidebarOpenDesktop
  const setSidebarOpen = isSidebarMobile
    ? setSidebarOpenMobile
    : setSidebarOpenDesktop

  useSwipeRight(swipeAreaRef, sidebarOpen, setSidebarOpen, {
    threshold: 50,
    targetDirection: 'left', // Sidebar opens from the left
    velocityThreshold: 0.5,
  })

  const {state, openMobile, isMobile, togglePanel} = useSettingsPanel()

  const isExpanded = useMemo(
    () => (isMobile ? openMobile : state === 'expanded'),
    [isMobile, openMobile, state],
  )

  return (
    <Wrapper ref={swipeAreaRef} isPanelExpanded={isExpanded}>
      <div className='ps-2 pe-3 sm:px-4 space-x-1 md:space-x-4 flex items-center justify-between min-w-0'>
        <SidebarTrigger />
        {toolbar}
        {withPanel && (
          <SettingsPanelTrigger
            state={isMobile ? (openMobile ? 'expanded' : 'collapsed') : state}
            toggleFn={togglePanel}
          />
        )}
      </div>
      {children}
    </Wrapper>
  )
}

interface WrapperProps {
  isPanelExpanded?: boolean
  children?: ReactNode
}

export const Wrapper = forwardRef<HTMLDivElement, WrapperProps>(
  ({children, isPanelExpanded}, ref) => {
    return (
      <div
        className={cn(
          'flex-1 min-w-0 w-full border border-foreground/40 dark:border-dark-table/40 bg-white dark:bg-origin',
          'drop-shadow-md md:overflow-hidden',
          'md:rounded-xl whitespace-nowrap',
          {'': isPanelExpanded},
        )}
        ref={ref}>
        {children}
      </div>
    )
  },
)

Wrapper.displayName = 'Wrapper'

export const Container = ({children}: {children: ReactNode}) => (
  <div className='relative bg-sidebar w-full min-w-0 md:p-5 flex h-screen overflow-clip'>
    {/*<div className='absolute top-1 hidden _flex items-center px-1 rounded-sm left-4 bg-amber-100/10 h-3 space-x-4 text-xs'></div>*/}
    {children}
  </div>
)

interface SettingsPanelTriggerProps {
  state: 'expanded' | 'collapsed'
  toggleFn: VoidFunction
}
const SettingsPanelTrigger = ({state, toggleFn}: SettingsPanelTriggerProps) => {
  const isMobile = useMobile()
  const isExpanded = useMemo(() => state === 'expanded', [state])
  return (
    <button
      className={cn(
        'p-1.5 rounded-md border-none hover:bg-light-gray/15 text-foreground hover:text-foreground',
        {'rotate-180': isExpanded},
      )}
      onClick={toggleFn}
      aria-label={isMobile ? 'Toggle Settings Panel' : 'Toggle Sidebar'}>
      <Icon
        name='sidebar'
        className={cn(
          'size-5 opacity-80 group-hover:opacity-100 transition-transform',
        )}
      />
      <span className='sr-only'>
        {isMobile ? 'Toggle Settings Panel' : 'Toggle Sidebar'}
      </span>
    </button>
  )
}
