import {useProvidersCtx} from '@/ctx'
import {Icon} from '@/lib/icons'
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
        onPress={handleToggle}
        radius='full'
        variant='flat'
        className='w-full border border-(--nav-border) bg(--surface-highlight) px-4 py-3 text-base font-medium text-background hover:bg-(--surface-muted)'></Button>
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
        className='border-none bg-transparent hover:bg-accent/20 text-white transition duration-200'>
        <Icon name={isDark ? 'sun' : 'moon'} className='size-4' />
      </Button>
    )
  )
}
