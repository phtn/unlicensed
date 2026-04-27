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
    targetDirection: 'left',
    velocityThreshold: 0.5,
    edgeThreshold: sidebarOpen ? 1 : 1 / 3,
  })

  const {state, openMobile, isMobile, togglePanel} = useSettingsPanel()

  const isExpanded = useMemo(
    () => (isMobile ? openMobile : state === 'expanded'),
    [isMobile, openMobile, state],
  )

  return (
    <Wrapper ref={swipeAreaRef} isPanelExpanded={isExpanded}>
      <div className='flex items-center justify-between gap-2 md:flex-nowrap md:gap-4 px-2 md:px-0'>
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
          'flex flex-1 min-h-0 min-w-0 w-full flex-col border border-dark-gray/40 dark:border-dark-table/40 bg-white dark:bg-origin',
          'drop-shadow-md',
          'md:rounded-xl whitespace-normal md:whitespace-nowrap',
          'px-2 md:px-4 -ml-1.5 md:ml-0 overflow-x-hidden overflow-y-auto md:overflow-hidden',
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
  <div className='relative bg-sidebar w-full min-w-0 md:p-5 flex h-svh md:h-screen overflow-hidden'>
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
