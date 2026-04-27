'use client'

import {useTheme} from '@/components/ui/theme-provider'
import {useToggle} from '@/hooks/use-toggle'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
import {useCallback, useMemo} from 'react'

type ThemeToggleProps = {
  variant?: 'icon' | 'menu'
  onAction?: () => void
}

export const ThemeToggle = ({variant = 'icon'}: ThemeToggleProps) => {
  const {theme, setTheme} = useTheme()
  const {on, toggle} = useToggle()

  const isDark = useMemo(() => {
    return theme === 'dark'
  }, [theme])

  const handleToggle = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark')
    toggle()
  }, [setTheme, isDark, toggle])

  if (variant !== 'icon') {
    return (
      <Button
        isIconOnly
        variant='tertiary'
        onPress={handleToggle}
        className={cn(
          'group w-40 items-center justify-start rounded-sm bg-transparent pb-1 ps-3.25 text-sm',
        )}>
        <Icon
          name='toggle-theme'
          className={cn(
            ' group:active:scale-90 transition-transform duration-200 ease-out size-4.5',
          )}
        />
        <span className='text-sm font-okxs font-normal tracking-tight px-1'>
          {isDark ? 'Light' : 'Dark'}
        </span>
      </Button>
    )
  }

  return (
    <Button
      isIconOnly
      onPress={handleToggle}
      variant='tertiary'
      aria-label='theme'
      className={cn(
        'group rounded-full border-none bg-transparent transition-all duration-200 hover:bg-accent-soft-hover active:scale-95 dark:text-white',
      )}>
      <div
        suppressHydrationWarning
        className={cn('rotate-45 transition-transform duration-700', {
          '-rotate-180': on,
        })}>
        <Icon name={'toggle-theme'} />
      </div>
    </Button>
  )
}
