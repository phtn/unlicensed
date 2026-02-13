import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
} from '@heroui/react'
import {Row} from '@tanstack/react-table'
import {Key, useCallback, useMemo} from 'react'
import type {ActionAlign, ActionConfig, ActionItem} from './create-column'

interface Props<T> {
  row: Row<T>
  actionConfig?: ActionConfig<T>
}

type ResolvedAction<T> = ActionItem<T> & {id: string}

const alignClassMap: Record<ActionAlign, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
}

const resolveRowCondition = <T,>(
  value: boolean | ((row: T) => boolean) | undefined,
  row: T,
): boolean => {
  if (typeof value === 'function') {
    return value(row)
  }
  return Boolean(value)
}

const toActionId = (label: string, index: number) =>
  `${label.toLowerCase().replace(/\s+/g, '-')}-${index}`

export const RowActions = <T,>({row, actionConfig}: Props<T>) => {
  const rowData = row.original
  const align = actionConfig?.align ?? 'center'

  const actions = useMemo<ResolvedAction<T>[]>(() => {
    const configured: ActionItem<T>[] = actionConfig?.actions ?? []
    const legacyCustom: ActionItem<T>[] =
      actionConfig?.customActions?.map((action, index) => ({
        id: `custom-${index}`,
        label: action.label,
        icon: action.icon,
        shortcut: action.shortcut,
        variant: action.variant,
        section: 'Actions',
        onClick: action.onClick,
      })) ?? []

    const legacyDefault: ActionItem<T>[] = []
    if (actionConfig?.viewFn) {
      legacyDefault.push({
        id: 'view',
        label: 'View',
        icon: 'eye',
        section: 'Actions',
        onClick: actionConfig.viewFn,
      })
    }
    if (actionConfig?.deleteFn) {
      legacyDefault.push({
        id: 'delete',
        label: 'Delete',
        icon: 'x',
        section: 'Danger',
        variant: 'destructive',
        shortcut: '⌘⌫',
        onClick: actionConfig.deleteFn,
      })
    }

    return [...configured, ...legacyCustom, ...legacyDefault]
      .filter((action) => !resolveRowCondition(action.hidden, rowData))
      .map((action, index) => ({
        ...action,
        id: action.id ?? toActionId(action.label, index),
      }))
  }, [actionConfig, rowData])

  const actionById = useMemo(() => {
    return new Map(actions.map((action) => [action.id, action]))
  }, [actions])

  const groupedActions = useMemo(() => {
    const groups = new Map<string, ResolvedAction<T>[]>()
    actions.forEach((action) => {
      const section = action.section ?? 'Actions'
      const sectionActions = groups.get(section) ?? []
      sectionActions.push(action)
      groups.set(section, sectionActions)
    })
    return Array.from(groups.entries()).map(([title, items]) => ({
      title,
      items,
    }))
  }, [actions])

  const runAction = useCallback(
    (action: ActionItem<T>) => {
      if (resolveRowCondition(action.disabled, rowData)) return
      action.onClick(rowData)
    },
    [rowData],
  )

  const handleMenuAction = useCallback(
    (key: Key) => {
      const action = actionById.get(String(key))
      if (!action) return
      runAction(action)
    },
    [actionById, runAction],
  )

  const triggerConfig = actionConfig?.trigger
  const defaultTrigger = (
    <Button
      isIconOnly={!triggerConfig?.label}
      size='sm'
      variant='light'
      className={cn(
        'shadow-none rounded-lg cursor-pointer hover:bg-terminal/10 dark:data-[state=open]:bg-terminal/50 data-[state=open]:bg-terminal/10',
        triggerConfig?.className,
      )}
      aria-label={triggerConfig?.label ?? 'Row actions'}>
      {triggerConfig?.icon ? (
        <Icon
          name={triggerConfig.icon}
          className='text-muted-foreground size-4'
        />
      ) : (
        <Icon name='details' className='text-muted-foreground size-4' />
      )}
      {triggerConfig?.label ? <span>{triggerConfig.label}</span> : null}
    </Button>
  )

  const trigger = triggerConfig?.render
    ? triggerConfig.render({
        row,
        loading: false,
        defaultTrigger,
      })
    : defaultTrigger

  const defaultDropdown = (
    <Dropdown
      placement='bottom-end'
      classNames={{
        base: 'rounded-3xl',
        content: 'rounded-3xl border-origin md:min-w-44 p-1.5',
      }}>
      <DropdownTrigger>{trigger}</DropdownTrigger>
      <DropdownMenu aria-label='Row actions' onAction={handleMenuAction}>
        {groupedActions.map((group, groupIndex) => (
          <DropdownSection
            key={`${group.title}-${groupIndex}`}
            title={groupedActions.length > 1 ? group.title : undefined}
            showDivider={groupIndex < groupedActions.length - 1}>
            {group.items.map((action) => {
              const isDestructive = action.variant === 'destructive'
              const isDisabled = resolveRowCondition(action.disabled, rowData)

              return (
                <DropdownItem
                  key={action.id}
                  color={isDestructive ? 'danger' : 'default'}
                  classNames={{
                    base: cn(
                      'h-10 rounded-xl',
                      isDestructive && 'text-danger',
                      action.className,
                      {'pointer-events-none opacity-50': isDisabled},
                    ),
                  }}
                  startContent={
                    <span className='inline-flex w-4 shrink-0 items-center justify-center'>
                      {action.icon ? (
                        <Icon
                          name={action.icon}
                          className={cn(
                            'size-4',
                            isDestructive && 'text-danger',
                          )}
                        />
                      ) : null}
                    </span>
                  }
                  endContent={
                    action.shortcut ? (
                      <span className='text-xs opacity-70 min-w-10 text-right'>
                        {action.shortcut}
                      </span>
                    ) : null
                  }>
                  {action.label}
                </DropdownItem>
              )
            })}
          </DropdownSection>
        ))}
      </DropdownMenu>
    </Dropdown>
  )

  const defaultButtons = (
    <div className={cn('flex w-full items-center gap-1', alignClassMap[align])}>
      {actions.map((action) => {
        const isIconButton = action.appearance === 'icon-button'
        const isDestructive = action.variant === 'destructive'
        const isDisabled = resolveRowCondition(action.disabled, rowData)

        return (
          <Button
            key={action.id}
            isIconOnly={isIconButton}
            size='sm'
            variant='light'
            color={isDestructive ? 'danger' : 'default'}
            isDisabled={isDisabled}
            className={cn(
              'h-8 rounded-lg',
              isIconButton ? 'w-8 min-w-8' : 'px-2 gap-2',
              action.className,
            )}
            onPress={() => runAction(action)}>
            <span className='inline-flex w-4 shrink-0 items-center justify-center'>
              {action.icon ? (
                <Icon name={action.icon} className='size-4' />
              ) : null}
            </span>
            {!isIconButton ? (
              <span className='whitespace-nowrap text-sm'>{action.label}</span>
            ) : null}
          </Button>
        )
      })}
    </div>
  )

  if (actionConfig?.render) {
    return actionConfig.render({
      row,
      actions,
      defaultDropdown,
      defaultButtons,
    })
  }

  const mode = actionConfig?.mode ?? 'dropdown'
  if (mode === 'buttons') return defaultButtons
  return defaultDropdown
}
