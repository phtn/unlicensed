import {useCallback, useEffect} from 'react'

export type Keys = 'k' | 'i' | '.' | '/'

interface UseWindowOptions {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  hotkey?: Keys
  onHotkey?: VoidFunction
}

export const useWindow = ({
  isOpen,
  onOpenChange,
  hotkey,
  onHotkey,
}: UseWindowOptions) => {
  const open = useCallback(() => {
    onOpenChange(true)
  }, [onOpenChange])

  const close = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const toggle = useCallback(() => {
    onOpenChange(!isOpen)
  }, [isOpen, onOpenChange])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault()
        close()
        return
      }

      if (!hotkey) return

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === hotkey) {
        event.preventDefault()
        toggle()
        onHotkey?.()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [close, hotkey, isOpen, onHotkey, toggle])

  return {
    isOpen,
    open,
    close,
    toggle,
  }
}
