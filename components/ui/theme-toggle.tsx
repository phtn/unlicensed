'use client'

import {useToggle} from '@/hooks/use-toggle'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
import {useTheme} from 'next-themes'
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
        variant='flat'
        onPress={handleToggle}
        className={cn(
          'group w-40 flex items-center bg-transparent justify-start space-x-2 py-3 text-sm ps-2 text-foreground hover:bg-(--surface-muted) dark:hover:bg-(--surface-muted)',
        )}>
        <Icon
          name='toggle-theme'
          className={cn(
            ' group:active:scale-90 transition-transform duration-200 ease-out',
          )}
        />
        <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
      </Button>
    )
  }

  return (
    <Button
      isIconOnly
      onPress={handleToggle}
      radius='full'
      variant='light'
      aria-label='theme'
      className={cn(
        'group active:scale-95 border-none bg-transparent hover:bg-accent/20 text-white transition-all duration-200',
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
