'use client'

import {DropdownItem} from '@heroui/react'
import {useId} from 'react'
import type {ReactNode} from 'react'

interface DropdownMenuProps {
  children: ReactNode
}

export const DropdownMenu = ({children}: DropdownMenuProps) => {
  return <>{children}</>
}

interface DropdownMenuTriggerProps {
  asChild?: boolean
  children: ReactNode
}

export const DropdownMenuTrigger = ({
  children,
}: DropdownMenuTriggerProps) => {
  return <>{children}</>
}

interface DropdownMenuContentProps {
  align?: 'start' | 'end' | 'center'
  alignOffset?: number
  children: ReactNode
  className?: string
}

export const DropdownMenuContent = ({
  children,
}: DropdownMenuContentProps) => {
  // This is a wrapper - actual content should be rendered by the parent using HeroUI Dropdown directly
  return <>{children}</>
}

interface DropdownMenuItemProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  onSelect?: (event: Event) => void
  asChild?: boolean
}

export const DropdownMenuItem = ({
  children,
  className,
  onClick,
  onSelect,
  asChild,
}: DropdownMenuItemProps) => {
  const itemKey = useId()

  if (asChild) {
    return <>{children}</>
  }
  return (
    <DropdownItem
      key={itemKey}
      className={className}
      onPress={() => {
        onClick?.()
        if (onSelect) {
          onSelect(new Event('select'))
        }
      }}>
      {children}
    </DropdownItem>
  )
}

interface DropdownMenuCheckboxItemProps {
  children: ReactNode
  checked?: boolean
  className?: string
  onCheckedChange?: (checked: boolean) => void
  onSelect?: (event: Event) => void
}

export const DropdownMenuCheckboxItem = ({
  children,
  checked,
  className,
  onCheckedChange,
  onSelect,
}: DropdownMenuCheckboxItemProps) => {
  const itemKey = useId()

  return (
    <DropdownItem
      key={itemKey}
      className={className}
      isSelected={checked}
      onPress={() => {
        onCheckedChange?.(!checked)
        if (onSelect) {
          onSelect(new Event('select'))
        }
      }}>
      {children}
    </DropdownItem>
  )
}

interface DropdownMenuLabelProps {
  children: ReactNode
  className?: string
}

export const DropdownMenuLabel = ({children, className}: DropdownMenuLabelProps) => {
  return <div className={className}>{children}</div>
}

interface DropdownMenuSeparatorProps {
  className?: string
}

export const DropdownMenuSeparator = ({className}: DropdownMenuSeparatorProps) => {
  return <div className={className} />
}

interface DropdownMenuGroupProps {
  children: ReactNode
  className?: string
}

export const DropdownMenuGroup = ({children, className}: DropdownMenuGroupProps) => {
  return <div className={className}>{children}</div>
}

interface DropdownMenuSubProps {
  children: ReactNode
}

export const DropdownMenuSub = ({children}: DropdownMenuSubProps) => {
  return <>{children}</>
}

interface DropdownMenuSubTriggerProps {
  children: ReactNode
  className?: string
}

export const DropdownMenuSubTrigger = ({
  children,
  className,
}: DropdownMenuSubTriggerProps) => {
  return <div className={className}>{children}</div>
}

interface DropdownMenuSubContentProps {
  children: ReactNode
  className?: string
  side?: 'left' | 'right' | 'top' | 'bottom'
  alignOffset?: number
  sideOffset?: number
}

export const DropdownMenuSubContent = ({
  children,
  className,
}: DropdownMenuSubContentProps) => {
  return <div className={className}>{children}</div>
}

interface DropdownMenuPortalProps {
  children: ReactNode
}

export const DropdownMenuPortal = ({children}: DropdownMenuPortalProps) => {
  return <>{children}</>
}

interface DropdownMenuShortcutProps {
  children: ReactNode
}

export const DropdownMenuShortcut = ({children}: DropdownMenuShortcutProps) => {
  return <span>{children}</span>
}
