'use client'

import {useTheme} from '@/components/ui/theme-provider'
import {useToggle} from '@/hooks/use-toggle'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@/lib/heroui'
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
        radius='sm'
        isIconOnly
        variant='tertiary'
        onPress={handleToggle}
        className={cn(
          'group w-40 flex items-center bg-transparent justify-start space-x-3 py-2 text-sm ps-3',
        )}>
        <Icon
          name='toggle-theme'
          className={cn(
            ' group:active:scale-90 transition-transform duration-200 ease-out size-4',
          )}
        />
        <span className='text-sm font-okxs font-normal tracking-tight'>
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      </Button>
    )
  }

  return (
    <Button
      isIconOnly
      onPress={handleToggle}
      radius='full'
      variant='tertiary'
      aria-label='theme'
      className={cn(
        'group active:scale-95 border-none bg-transparent hover:bg-accent/20 dark:text-white transition-all duration-200',
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
