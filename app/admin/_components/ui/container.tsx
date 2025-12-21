'use client'

import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {ReactNode, useMemo} from 'react'
import {useSettingsPanel} from './settings'
import {SidebarTrigger} from './sidebar'

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
  const {state, togglePanel} = useSettingsPanel()
  const isExpanded = useMemo(() => state === 'expanded', [state])
  return (
    <Wrapper isPanelExpanded={isExpanded}>
      <div className='px-3 sm:px-4 space-x-4 flex items-center justify-between min-w-0'>
        <SidebarTrigger />
        {toolbar}
        {withPanel && (
          <SettingsPanelTrigger state={state} toggleFn={togglePanel} />
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
export const Wrapper = ({children, isPanelExpanded}: WrapperProps) => {
  return (
    <div
      className={cn(
        'flex-1 min-w-0 w-full border border-zinc-300 dark:border-dark-table/40 bg-white dark:bg-origin',
        'drop-shadow-xl _max-h-[calc(100lvh-30px)] md:overflow-hidden',
        'md:rounded-xl whitespace-nowrap',
        {'': isPanelExpanded},
      )}>
      {children}
    </div>
  )
}

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
  const isExpanded = useMemo(() => state === 'expanded', [state])
  return (
    <button
      className={cn(
        'p-1.5 rounded-md border-none hover:bg-light-gray/15 text-foreground hover:text-foreground',
        {'rotate-180': isExpanded},
      )}
      onClick={toggleFn}>
      <Icon
        name='sidebar'
        className={cn('size-5 opacity-80 group-hover:opacity-100')}
      />
      <span className='sr-only'>Toggle Sidebar</span>
    </button>
  )
}
