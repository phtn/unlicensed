import {useProvidersCtx} from '@/ctx'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
import {useCallback, useMemo} from 'react'

type ThemeToggleProps = {
  variant?: 'icon' | 'menu'
  onAction?: () => void
}

export const ThemeToggle = ({variant = 'icon', onAction}: ThemeToggleProps) => {
  const {theme, toggleTheme, isThemeReady} = useProvidersCtx()

  const handleToggle = useCallback(() => {
    toggleTheme()
    onAction?.()
  }, [toggleTheme, onAction])

  const isDark = useMemo(() => theme === 'dark', [theme])

  if (!isThemeReady && variant === 'icon') {
    return (
      <Button
        isIconOnly
        radius='full'
        variant='flat'
        aria-label='Loading theme preference'
        className='border border-(--nav-border) bg-(--surface-highlight)'
        isDisabled>
        <span className='h-4 w-4 animate-pulse rounded-full' />
      </Button>
    )
  }

  if (variant === 'menu') {
    return (
      <Button
        radius='sm'
        variant='flat'
        onPress={handleToggle}
        className='group w-40 flex items-center justify-start space-x-2 border py-3 text-sm text-foreground hover:bg-(--surface-muted) dark:hover:bg-(--surface-muted)'>
        <Icon
          name='toggle-theme'
          className={cn(
            ' group:active:scale-90 transition-transform duration-200 ease-out',
            {'rotate-180': isDark},
          )}
        />
        <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
      </Button>
    )
  }

  return (
    isThemeReady && (
      <Button
        isIconOnly
        onPress={handleToggle}
        radius='full'
        variant='solid'
        aria-label='theme'
        className='group active:scale-95 border-none bg-transparent hover:bg-accent/20 text-white transition duration-200'>
        <Icon
          name={'toggle-theme'}
          className={cn(
            'rotate-0 group-active:scale-85 transition-all duration-200 ease-out',
            {
              'rotate-180': isDark,
            },
          )}
        />
      </Button>
    )
  )
}
