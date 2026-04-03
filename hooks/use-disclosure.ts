'use client'

import { useCallback, useState } from 'react'

interface UseDisclosureOptions {
  defaultOpen?: boolean
  isOpen?: boolean
  onChange?: (isOpen: boolean) => void
}

export const useDisclosure = ({
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onChange,
}: UseDisclosureOptions = {}) => {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(defaultOpen)
  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen

  const setIsOpen = useCallback(
    (nextIsOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledIsOpen(nextIsOpen)
      }

      onChange?.(nextIsOpen)
    },
    [isControlled, onChange],
  )

  const onOpen = useCallback(() => {
    setIsOpen(true)
  }, [setIsOpen])

  const onClose = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  const onOpenChange = useCallback(
    (nextIsOpen?: boolean) => {
      setIsOpen(typeof nextIsOpen === 'boolean' ? nextIsOpen : !isOpen)
    },
    [isOpen, setIsOpen],
  )

  return {
    isOpen,
    onClose,
    onOpen,
    onOpenChange,
    setIsOpen,
  }
}
