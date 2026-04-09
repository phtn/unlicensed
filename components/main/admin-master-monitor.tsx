'use client'

import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {Button} from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {ScrollArea} from '@/components/ui/scroll-area'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {
  ADMIN_MASTER_MONITOR_OPEN_EVENT,
  ADMIN_MASTER_MONITOR_TOGGLE_EVENT,
} from '@/lib/admin-master-monitor'
import {Icon} from '@/lib/icons'
import {
  canAccessMasterMonitor,
  canStaffRecordAccessMasterMonitor,
  getMasterMonitorEmails,
  isMasterMonitorEmail,
  MASTER_MONITOR_IDENTIFIER,
} from '@/lib/master-monitor-access'
import {cn} from '@/lib/utils'
import {formatPrice} from '@/utils/formatPrice'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from 'react'
import {getInitials} from '@/utils/initials'

const HOTKEY_KEY = 'm'
const HOTKEY_LABEL = '⌘⇧M'
const FALLBACK_HOTKEY_LABEL = 'Ctrl+Shift+M'

type StaffMember = Doc<'staff'>

function getStaffDisplayName(staff: StaffMember) {
  const name = staff.name?.trim()
  if (name) return name

  const emailName = staff.email?.split('@')[0]?.trim()
  if (emailName) return emailName

  return 'Unknown operator'
}

function formatRoleLabel(role: string) {
  const trimmed = role.trim()
  if (!trimmed) return 'Role'
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

function getOperatorLabel(staff: StaffMember | null | undefined) {
  if (staff === undefined) return 'Checking access'
  if (staff === null) return 'Active staff record required'

  return 'Master email verification required'
}

function getOperatorTone({
  staff,
  hasAccess,
  isEmailListed,
  isMasterListLoaded,
}: {
  staff: StaffMember | null | undefined
  hasAccess: boolean
  isEmailListed: boolean
  isMasterListLoaded: boolean
}) {
  if (staff === undefined || !isMasterListLoaded) {
    return 'border-border/60 bg-muted/40 text-muted-foreground'
  }

  if (hasAccess) {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
  }

  if (staff === null || !staff.active) {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
  }

  return isEmailListed
    ? 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300'
    : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
}

function sortAuthorizedStaff(staffMembers: readonly StaffMember[]) {
  return [...staffMembers].sort((left, right) => {
    const leftKey =
      `${getStaffDisplayName(left)} ${left.email ?? ''}`.toLowerCase()
    const rightKey =
      `${getStaffDisplayName(right)} ${right.email ?? ''}`.toLowerCase()

    return leftKey.localeCompare(rightKey)
  })
}

type MonitorStat = {
  label: string
  value: string
  description: string
  toneClassName: string
}

export function AdminMasterMonitor() {
  const {user} = useAuthCtx()
  const [isOpen, setIsOpen] = useState(false)

  const currentStaff = useQuery(
    api.staff.q.getStaffByEmail,
    user?.email ? {email: user.email} : 'skip',
  )
  const staffMembers = useQuery(api.staff.q.getStaff)
  const masterMonitorSetting = useQuery(api.admin.q.getAdminByIdentifier, {
    identifier: MASTER_MONITOR_IDENTIFIER,
  })
  const adminStats = useQuery(api.orders.q.getAdminStats, {})
  const activityStats = useQuery(api.activities.q.getActivityStats, {days: 7})
  const masterEmails = useMemo(
    () => getMasterMonitorEmails(masterMonitorSetting),
    [masterMonitorSetting],
  )
  const isMasterListLoaded = masterMonitorSetting !== undefined
  const isCurrentEmailListed = useMemo(
    () => isMasterMonitorEmail(user?.email, masterEmails),
    [masterEmails, user?.email],
  )

  const hasMonitorAccess = useMemo(
    () =>
      canAccessMasterMonitor({
        staff: currentStaff,
        email: user?.email,
        masterEmails,
      }),
    [currentStaff, masterEmails, user?.email],
  )

  const authorizedStaff = useMemo(
    () =>
      sortAuthorizedStaff(
        (staffMembers ?? []).filter((staff) =>
          canStaffRecordAccessMasterMonitor(staff, masterEmails),
        ),
      ),
    [masterEmails, staffMembers],
  )

  const monitorStats = useMemo<MonitorStat[]>(() => {
    const deliveredLabel =
      adminStats === undefined
        ? 'Loading'
        : `${adminStats.deliveredOrdersCount}/${adminStats.totalOrdersCount}`

    return [
      {
        label: 'Pending Orders',
        value:
          adminStats === undefined ? '...' : String(adminStats.pendingOrdersCount),
        description: 'Orders waiting for payment or action',
        toneClassName:
          'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
      },
      {
        label: 'Revenue Today',
        value:
          adminStats === undefined ? '...' : formatPrice(adminStats.salesTodayCents),
        description: 'Completed payments since local midnight',
        toneClassName:
          'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      },
      {
        label: 'Deliveries',
        value: deliveredLabel,
        description:
          adminStats === undefined
            ? 'Delivered vs total orders'
            : `${adminStats.ongoingDeliveriesCount} ongoing deliveries`,
        toneClassName:
          'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300',
      },
      {
        label: 'Activity 7d',
        value:
          activityStats === undefined
            ? '...'
            : String(activityStats.totalActivities),
        description:
          activityStats === undefined
            ? 'Recent operational activity'
            : `${activityStats.ordersCreated} orders created, ${activityStats.paymentsCompleted} payments completed`,
        toneClassName:
          'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300',
      },
    ]
  }, [activityStats, adminStats])

  const currentOperatorName =
    user?.displayName?.trim() ||
    (currentStaff ? getStaffDisplayName(currentStaff) : null) ||
    user?.email?.split('@')[0] ||
    'No active operator'

  const currentOperatorMeta =
    currentStaff?.position?.trim() ||
    user?.email ||
    'Sign in with an authorized staff account'

  const dialogOpen = isOpen && hasMonitorAccess

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen && !hasMonitorAccess) {
        return
      }

      setIsOpen(nextOpen)
    },
    [hasMonitorAccess],
  )

  const onShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.repeat) return
    if (!(event.metaKey || event.ctrlKey) || !event.shiftKey) return
    if (event.key.toLowerCase() !== HOTKEY_KEY) return

    event.preventDefault()

    if (!hasMonitorAccess) return

    setIsOpen((open) => !open)
  })

  const onToggleRequest = useEffectEvent(() => {
    if (!hasMonitorAccess) return
    setIsOpen((open) => !open)
  })

  const onOpenRequest = useEffectEvent(() => {
    if (!hasMonitorAccess) return
    setIsOpen(true)
  })

  useEffect(() => {
    document.addEventListener('keydown', onShortcut)

    return () => {
      document.removeEventListener('keydown', onShortcut)
    }
  }, [])

  useEffect(() => {
    window.addEventListener(ADMIN_MASTER_MONITOR_TOGGLE_EVENT, onToggleRequest)
    window.addEventListener(ADMIN_MASTER_MONITOR_OPEN_EVENT, onOpenRequest)

    return () => {
      window.removeEventListener(
        ADMIN_MASTER_MONITOR_TOGGLE_EVENT,
        onToggleRequest,
      )
      window.removeEventListener(ADMIN_MASTER_MONITOR_OPEN_EVENT, onOpenRequest)
    }
  }, [])

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className='max-w-[calc(100vw-1.5rem)] gap-0 overflow-hidden border-border/60 bg-background/95 p-0 shadow-2xl sm:max-w-3xl'>
        <DialogHeader className='gap-4 border-b border-border/60 bg-linear-to-br from-brand/12 via-background to-background px-5 py-5 text-left sm:px-6'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex items-start gap-3'>
              <div className='flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/20'>
                <Icon name='safe-shield' className='size-5' />
              </div>

              <div className='space-y-1'>
                <DialogTitle className='text-xl tracking-tight'>
                  Admin Master Monitor
                </DialogTitle>
                <DialogDescription className='max-w-xl text-sm leading-6'>
                  Global staff monitor for admin operators. Open it anywhere in
                  the app with {HOTKEY_LABEL} or {FALLBACK_HOTKEY_LABEL}.
                </DialogDescription>
              </div>
            </div>

            <div className='hidden rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground sm:block'>
              {HOTKEY_LABEL}
            </div>
          </div>
        </DialogHeader>

        <div className='grid gap-4 px-5 py-5 sm:px-6 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]'>
          <section className='rounded-2xl border border-border/60 bg-card/70 p-4'>
            <div className='flex items-start gap-3'>
              <Avatar size='lg' className='border border-border/60'>
                <AvatarImage
                  alt={currentOperatorName}
                  src={user?.photoURL ?? undefined}
                />
                <AvatarFallback>{getInitials(currentOperatorName)}</AvatarFallback>
              </Avatar>

              <div className='min-w-0 flex-1'>
                <p className='text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase'>
                  Current Operator
                </p>
                <p className='truncate text-lg font-semibold'>
                  {currentOperatorName}
                </p>
                <p className='truncate text-sm text-muted-foreground'>
                  {currentOperatorMeta}
                </p>
              </div>
            </div>

            <div
              className={cn(
                'mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-medium',
                getOperatorTone({
                  staff: currentStaff,
                  hasAccess: hasMonitorAccess,
                  isEmailListed: isCurrentEmailListed,
                  isMasterListLoaded,
                }),
              )}>
              {hasMonitorAccess
                ? 'Master monitor access granted'
                : !isMasterListLoaded
                  ? 'Loading master list'
                : currentStaff === null
                  ? getOperatorLabel(currentStaff)
                : isCurrentEmailListed
                    ? 'Staff record found, waiting for active access'
                    : 'Email not on master list'}
            </div>

            <dl className='mt-4 grid gap-3 text-sm'>
              <div className='rounded-xl border border-border/60 bg-background/70 p-3'>
                <dt className='text-xs tracking-[0.16em] text-muted-foreground uppercase'>
                  Quick Links
                </dt>
                <dd className='mt-2 grid gap-2 sm:grid-cols-2'>
                  <Button asChild size='sm'>
                    <Link href='/admin'>Admin Home</Link>
                  </Button>
                  <Button asChild size='sm' variant='outline'>
                    <Link href='/admin/ops/orders'>Orders</Link>
                  </Button>
                  <Button asChild size='sm' variant='outline'>
                    <Link href='/admin/inventory/product'>Inventory</Link>
                  </Button>
                  <Button asChild size='sm' variant='outline'>
                    <Link href='/admin/messaging/chat'>Messaging</Link>
                  </Button>
                </dd>
              </div>

              <div className='rounded-xl border border-border/60 bg-background/70 p-3'>
                <dt className='text-xs tracking-[0.16em] text-muted-foreground uppercase'>
                  Access Rule
                </dt>
                <dd className='mt-1 leading-6 text-foreground/90'>
                  Access requires two checks: the account must belong to an
                  active staff member, and that same account email must appear
                  on the configured master list.
                </dd>
              </div>

              <div className='rounded-xl border border-border/60 bg-background/70 p-3'>
                <dt className='text-xs tracking-[0.16em] text-muted-foreground uppercase'>
                  Master List
                </dt>
                <dd className='mt-2 flex flex-wrap gap-2'>
                  {masterMonitorSetting === undefined ? (
                    <span className='text-sm text-muted-foreground'>
                      Loading master emails...
                    </span>
                  ) : masterEmails.length > 0 ? (
                    masterEmails.map((email) => (
                      <span
                        key={email}
                        className='rounded-full border border-border/60 bg-muted/50 px-2 py-1 text-[11px] font-medium text-foreground/80'>
                        {email}
                      </span>
                    ))
                  ) : (
                    <span className='text-sm text-muted-foreground'>
                      No master emails configured.
                    </span>
                  )}
                </dd>
              </div>

              <div className='rounded-xl border border-border/60 bg-background/70 p-3'>
                <dt className='text-xs tracking-[0.16em] text-muted-foreground uppercase'>
                  Monitor State
                </dt>
                <dd className='mt-2 flex flex-wrap gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setIsOpen(false)}>
                    Dismiss
                  </Button>
                </dd>
              </div>
            </dl>
          </section>

          <section className='rounded-2xl border border-border/60 bg-card/70 p-4'>
            <div className='grid gap-2 sm:grid-cols-2'>
              {monitorStats.map((stat) => (
                <div
                  key={stat.label}
                  className='rounded-2xl border border-border/60 bg-background/75 p-3'>
                  <div
                    className={cn(
                      'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium',
                      stat.toneClassName,
                    )}>
                    {stat.label}
                  </div>
                  <p className='mt-3 text-xl font-semibold tracking-tight'>
                    {stat.value}
                  </p>
                  <p className='mt-1 text-xs leading-5 text-muted-foreground'>
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>

            <div className='flex items-center justify-between gap-3'>
              <div className='mt-4'>
                <p className='text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase'>
                  Authorized Operators
                </p>
                <p className='text-sm text-muted-foreground'>
                  Active staff records whose emails are on the master list.
                </p>
              </div>

              <div className='rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium'>
                {authorizedStaff.length}
              </div>
            </div>

            <ScrollArea className='mt-4 h-[22rem] pr-3'>
              {staffMembers === undefined ? (
                <div className='rounded-xl border border-dashed border-border/60 bg-background/60 px-4 py-6 text-sm text-muted-foreground'>
                  Loading authorized staff roster...
                </div>
              ) : authorizedStaff.length === 0 ? (
                <div className='rounded-xl border border-dashed border-border/60 bg-background/60 px-4 py-6 text-sm text-muted-foreground'>
                  No active admin-capable staff records are available.
                </div>
              ) : (
                <ul className='space-y-2'>
                  {authorizedStaff.map((staff) => {
                    const isCurrentOperator = currentStaff?._id === staff._id
                    const staffDisplayName = getStaffDisplayName(staff)
                    const secondaryLabel = [
                      staff.position?.trim(),
                      staff.division?.trim(),
                      staff.email?.trim(),
                    ]
                      .filter(Boolean)
                      .join(' · ')

                    return (
                      <li
                        key={staff._id}
                        className={cn(
                          'rounded-2xl border border-border/60 bg-background/75 p-3 transition-colors',
                          isCurrentOperator && 'border-brand/50 bg-brand/5',
                        )}>
                        <div className='flex items-start gap-3'>
                          <Avatar className='border border-border/60'>
                            <AvatarImage
                              alt={staffDisplayName}
                              src={staff.avatarUrl ?? undefined}
                            />
                            <AvatarFallback>
                              {getInitials(staffDisplayName)}
                            </AvatarFallback>
                          </Avatar>

                          <div className='min-w-0 flex-1'>
                            <div className='flex flex-wrap items-center gap-2'>
                              <p className='truncate font-medium'>
                                {staffDisplayName}
                              </p>
                              {isCurrentOperator ? (
                                <span className='rounded-full border border-brand/40 bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand'>
                                  You
                                </span>
                              ) : null}
                            </div>

                            <p className='mt-1 text-sm text-muted-foreground'>
                              {secondaryLabel || 'Staff account'}
                            </p>

                            <div className='mt-2 flex flex-wrap gap-1.5'>
                              {staff.accessRoles.map((role) => (
                                <span
                                  key={`${staff._id}-${role}`}
                                  className='rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-foreground/80'>
                                  {formatRoleLabel(role)}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </ScrollArea>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
