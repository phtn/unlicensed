'use client'

import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {
  ADMIN_MASTER_MONITOR_OPEN_EVENT,
  ADMIN_MASTER_MONITOR_TOGGLE_EVENT,
} from '@/lib/admin-master-monitor'
import {
  canAccessMasterMonitor,
  canStaffRecordAccessMasterMonitor,
  getMasterMonitorEmails,
  getMasterMonitorEntries,
  getMasterTypeForEmail,
  isMasterMonitorEmail,
  MASTER_MONITOR_IDENTIFIER,
  type MasterEntry,
} from '@/lib/master-monitor-access'
import {cn} from '@/lib/utils'
import {formatPrice} from '@/utils/formatPrice'
import {Tabs} from '@base-ui/react'
import {ProgressBar} from '@heroui/react'
import {useQuery} from 'convex/react'
import {useCallback, useEffect, useEffectEvent, useMemo, useState} from 'react'
import {User} from '../hero-v3/user'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import {ScrollArea} from '../ui/scroll-area'

const HOTKEY_KEY = 'm'
const HOTKEY_LABEL = '⌘⇧M'
const FALLBACK_HOTKEY_LABEL = 'Ctrl+Shift+M'

type StaffMember = Doc<'staff'>
type EmailBlast = Doc<'emailBlasts'>

type MonitorStat = {
  label: string
  value: string
  description: string
  toneClassName: string
}

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

function formatMasterTypeLabel(type: MasterEntry['type']) {
  return type
}

function formatDateTime(value: number | undefined) {
  if (!value) return 'N/A'

  return new Date(value).toLocaleString()
}

function getOperatorLabel(staff: StaffMember | null | undefined) {
  if (staff === undefined) return 'Checking access'
  if (staff === null) return 'Active staff record required'
  if (!staff.active) return 'Staff record inactive'

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
    return 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300'
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

function getBlastTone(status: EmailBlast['status']) {
  switch (status) {
    case 'completed':
      return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    case 'failed':
      return 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300'
    case 'sending':
      return 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300'
    case 'queued':
      return 'border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-300'
    default:
      return 'border-border/60 bg-muted/40 text-muted-foreground'
  }
}

function getBlastProgress(blast: EmailBlast) {
  if (blast.totalRecipients <= 0) return 0

  return (blast.processedRecipients / blast.totalRecipients) * 100
}

function BlastCard({blast}: {blast: EmailBlast}) {
  return (
    <div className='bg-background/70 p-4'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='space-y-1'>
          <p className='font-medium text-foreground/90'>
            {blast.templateTitle}
          </p>
          <p className='text-sm text-muted-foreground'>
            {blast.mailingListName}
          </p>
        </div>
        <span
          className={cn(
            'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em]',
            getBlastTone(blast.status),
          )}>
          {blast.status}
        </span>
      </div>

      <div className='mt-4 space-y-2'>
        <ProgressBar
          aria-label='Email blast progress'
          value={getBlastProgress(blast)}
          color={blast.status === 'failed' ? 'danger' : 'success'}
          valueLabel={`${blast.processedRecipients} / ${blast.totalRecipients}`}>
          <ProgressBar.Output className='text-sm text-foreground/60' />
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>

        <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
          <span>Sent {blast.sentRecipients}</span>
          <span>Failed {blast.failedRecipients}</span>
          {blast.currentRecipientEmail ? (
            <span>Current {blast.currentRecipientEmail}</span>
          ) : null}
        </div>

        {blast.lastError ? (
          <p className='text-sm text-danger'>{blast.lastError}</p>
        ) : null}

        <div className='grid gap-2 text-xs text-muted-foreground sm:grid-cols-2'>
          <p>Started {formatDateTime(blast.startedAt)}</p>
          <p>Updated {formatDateTime(blast.updatedAt)}</p>
          {blast.finishedAt ? (
            <p>Finished {formatDateTime(blast.finishedAt)}</p>
          ) : null}
          <p>By {blast.initiatedByEmail}</p>
        </div>
      </div>
    </div>
  )
}

function StatsGrid({stats}: {stats: MonitorStat[]}) {
  return (
    <div className='grid gap-2 sm:grid-cols-2'>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            'border border-border/60 bg-background/75 p-3',
            stat.toneClassName,
          )}>
          <div
            className={cn(
              'flex items-center space-x-3 px-2.5 text-[11px] font-medium',
            )}>
            <p className='font-clash text-xl tracking-tight dark:text-white'>
              {stat.value}
            </p>
            <span>{stat.label}</span>
          </div>

          <p className='mt-1 text-xs leading-5 text-muted-foreground'>
            {stat.description}
          </p>
        </div>
      ))}
    </div>
  )
}

export function AdminMasterMonitor() {
  const {user} = useAuthCtx()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('orders')

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
  const activeBlasts = useQuery(api.emailBlasts.q.listActive, {limit: 4})
  const recentBlasts = useQuery(api.emailBlasts.q.listRecent, {limit: 6})

  const masterEntries = useMemo(
    () => getMasterMonitorEntries(masterMonitorSetting),
    [masterMonitorSetting],
  )
  const masterEmails = useMemo(
    () => getMasterMonitorEmails(masterMonitorSetting),
    [masterMonitorSetting],
  )
  const isMasterListLoaded = masterMonitorSetting !== undefined
  const currentMasterType = useMemo(
    () => getMasterTypeForEmail(user?.email, masterEntries),
    [masterEntries, user?.email],
  )
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
  const latestBlast = activeBlasts?.[0] ?? recentBlasts?.[0] ?? null

  const monitorStats = useMemo<MonitorStat[]>(() => {
    const deliveredLabel =
      adminStats === undefined
        ? 'Loading'
        : `${adminStats.deliveredOrdersCount}/${adminStats.totalOrdersCount}`

    return [
      {
        label: 'Pending Orders',
        value:
          adminStats === undefined
            ? '...'
            : String(adminStats.pendingOrdersCount),
        description: 'Orders waiting for payment or action',
        toneClassName:
          'border-orange-500/20 bg-orange-500/10 dark:bg-orange-800/10 text-orange-700 dark:text-orange-200',
      },
      {
        label: 'Revenue Today',
        value:
          adminStats === undefined
            ? '...'
            : formatPrice(adminStats.salesTodayCents),
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
          'border-light-brand/20 bg-light-brand/10 text-light-brand dark:text-light-brand',
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
      if (nextOpen) {
        setActiveTab('overview')
      }
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
      <DialogContent className='z-9999 max-w-[calc(100vw-1rem)] gap-0 overflow-hidden border-border/60 bg-background/95 dark:bg-dark-table/40 backdrop-blur-xl p-0 shadow-2xl sm:max-w-4xl'>
        <DialogHeader className='gap-3 border-b border-border/60 bg-linear-to-br from-brand/12 via-background to-background p-3 text-left'>
          <div className='flex items-start justify-between gap-3'>
            <div className='flex items-center gap-3'>
              <div className='flex size-3.5 shrink-0 rounded-full bg-[#ff5c5f] shadow-lg' />

              <div className='space-y-1'>
                <DialogTitle className='font-okxs text-lg leading-none tracking-wide'>
                  Master
                </DialogTitle>
                <DialogDescription className='text-xs text-muted-foreground'></DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <div className='flex min-h-144 flex-col'>
            <div className='p-3'>
              <div className='overflow-x-auto'>
                <Tabs.List className='relative z-0 flex w-max min-w-full gap-1 rounded-xl border border-default-200/70 bg-background/80 p-1 backdrop-blur-sm'>
                  {[
                    {id: 'orders', label: 'Orders'},
                    {id: 'mail', label: 'Mail'},
                    {id: 'settings', label: 'Settings'},
                  ].map((tab) => (
                    <Tabs.Tab
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        'relative z-10 flex h-10 shrink-0 items-center justify-center rounded-lg border-0 px-3 sm:px-4',
                        'whitespace-nowrap text-xs font-medium tracking-wide text-default-600 outline-none select-none data-active:text-white',
                        'transition-colors duration-150',
                      )}>
                      {tab.label}
                    </Tabs.Tab>
                  ))}
                  <Tabs.Indicator className='absolute inset-y-1 left-0 z-0 h-auto w-(--active-tab-width) translate-x-(--active-tab-left) rounded-lg bg-linear-to-r from-slate-600/90 via-slate-900/90 to-origin transition-all duration-300 ease-in-out dark:via-dark-table dark:to-dark-table' />
                </Tabs.List>
              </div>
            </div>

            <div className='min-h-0 flex-1'>
              <Tabs.Panel value='orders' className='h-full'>
                <ScrollArea className='h-128'>
                  <div className='space-y-4 p-4'>
                    <StatsGrid stats={monitorStats} />
                  </div>
                </ScrollArea>
              </Tabs.Panel>

              <Tabs.Panel value='mail' className='h-full'>
                <ScrollArea className='h-128'>
                  <div className='space-y-4 p-4 grid grid-cols-2 gap-4'>
                    <section>
                      {/*===MAIL STATUS===*/}
                      <div className=''>
                        <div className='bg-card/70 p-2'>
                          <p className='text-sm font-medium tracking-[0.18em] text-emerald-400 uppercase'>
                            Mail Status
                          </p>
                          <p className='mt-1 text-sm text-muted-foreground'>
                            Background email blasts now keep running even if the
                            sender leaves the email page.
                          </p>

                          {latestBlast ? (
                            <div className='mt-4'>
                              <BlastCard blast={latestBlast} />
                            </div>
                          ) : (
                            <div className='mt-4 rounded-2xl border border-dashed border-border/60 bg-background/60 px-4 py-6 text-sm text-muted-foreground'>
                              No recent email blast activity.
                            </div>
                          )}
                        </div>
                      </div>
                    </section>

                    <section className='bg-card/70 p-2'>
                      <div className='space-y-1'>
                        <p className='text-sm font-medium tracking-[0.18em] text-emerald-400 uppercase'>
                          Active Email Blasts
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          These runs continue in the background after the sender
                          leaves the email screen.
                        </p>
                      </div>

                      <div className='mt-4 space-y-3'>
                        {activeBlasts === undefined ? (
                          <div className='rounded-2xl border border-dashed border-border/60 bg-background/60 px-4 py-6 text-sm text-muted-foreground'>
                            Loading active blast status...
                          </div>
                        ) : activeBlasts.length === 0 ? (
                          <div className='rounded-2xl border border-dashed border-border/60 bg-background/60 px-4 py-6 text-sm text-muted-foreground'>
                            No active email blasts.
                          </div>
                        ) : (
                          activeBlasts.map((blast) => (
                            <BlastCard key={blast._id} blast={blast} />
                          ))
                        )}
                      </div>
                    </section>

                    <section className='mt-8 bg-card/70 p-2'>
                      <div className='space-y-1'>
                        <p className='text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase'>
                          Recent Blast History
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          Most recent completed or failed runs.
                        </p>
                      </div>

                      <div className='mt-4 space-y-3'>
                        {recentBlasts === undefined ? (
                          <div className='rounded-2xl border border-dashed border-border/60 bg-background/60 px-4 py-6 text-sm text-muted-foreground'>
                            Loading recent blast history...
                          </div>
                        ) : recentBlasts.length === 0 ? (
                          <div className='rounded-2xl border border-dashed border-border/60 bg-background/60 px-4 py-6 text-sm text-muted-foreground'>
                            No blast history yet.
                          </div>
                        ) : (
                          recentBlasts.map((blast) => (
                            <BlastCard key={blast._id} blast={blast} />
                          ))
                        )}
                      </div>
                    </section>
                  </div>
                </ScrollArea>
              </Tabs.Panel>

              <Tabs.Panel value='settings' className='h-full'>
                <ScrollArea className='h-128'>
                  <div className='grid gap-4 p-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]'>
                    <section className='bg-card/70 p-4'>
                      <p className='text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase'>
                        Masters
                      </p>
                      <div className='mt-4 flex flex-wrap gap-2'>
                        {masterEntries.map((entry) => (
                          <div
                            key={entry.email}
                            className='flex items-center gap-2 rounded-md bg-background/70 px-2.5 py-2 text-xs'>
                            <div className='opacity-60 font-bold text-base'>
                              {formatMasterTypeLabel(entry.type)}
                            </div>
                            <div className='font-medium text-foreground/90'>
                              {entry.email}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className='mt-28 hidden'>
                        <div className='bg-card/70'>
                          <p className='text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase'>
                            Access Rule
                          </p>
                          <p className='mt-2 text-sm leading-6 text-foreground/90'>
                            Must belong to an active staff member, and the
                            master list. Master types are OG, TOP-G, and SB.
                          </p>

                          <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                            <div className='rounded-xl border border-border/60 bg-background/70 p-3'>
                              <p className='text-xs tracking-[0.16em] text-muted-foreground uppercase'>
                                Active Blasts
                              </p>
                              <p className='mt-2 text-2xl font-semibold'>
                                {activeBlasts?.length ?? 0}
                              </p>
                            </div>
                            <div className='rounded-xl border border-border/60 bg-background/70 p-3'>
                              <p className='text-xs tracking-[0.16em] text-muted-foreground uppercase'>
                                Master Roster
                              </p>
                              <p className='mt-2 text-2xl font-semibold'>
                                {masterEntries.length}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className='hidden bg-card/70 p-4'>
                      <div className='flex items-center justify-between gap-3'>
                        <div>
                          <p className='text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase'>
                            Authorized
                          </p>
                          <p className='text-sm text-muted-foreground'>
                            Active staff records whose emails are on the master
                            list.
                          </p>
                        </div>
                        <div className='rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium'>
                          {authorizedStaff.length}
                        </div>
                      </div>

                      <div className='mt-4 space-y-2'>
                        {staffMembers === undefined ? (
                          <div className='rounded-xl border border-dashed border-border/60 bg-background/60 px-4 py-6 text-sm text-muted-foreground'>
                            Loading authorized staff roster...
                          </div>
                        ) : authorizedStaff.length === 0 ? (
                          <div className='rounded-xl border border-dashed border-border/60 bg-background/60 px-4 py-6 text-sm text-muted-foreground'>
                            No active master staff records are available.
                          </div>
                        ) : (
                          authorizedStaff.map((staff) => {
                            const isCurrentOperator =
                              currentStaff?._id === staff._id
                            const masterType = getMasterTypeForEmail(
                              staff.email,
                              masterEntries,
                            )

                            return (
                              <div
                                key={staff._id}
                                className={cn(
                                  'bg-background/75 p-3 transition-colors',
                                  isCurrentOperator &&
                                    'border-brand/50 bg-brand/5',
                                )}>
                                <div className='flex items-start gap-3'>
                                  <User
                                    name={getStaffDisplayName(staff)}
                                    avatar={staff.avatarUrl ?? undefined}
                                    className='size-10 border border-border/60'
                                  />
                                  <div className='min-w-0 flex-1'>
                                    <div className='flex flex-wrap items-center gap-2'>
                                      <p className='truncate font-medium'>
                                        {getStaffDisplayName(staff)}
                                      </p>
                                      {isCurrentOperator ? (
                                        <span className='rounded-md bg-brand px-2 py-0.5 text-[8px] font-medium text-white uppercase tracking-wider'>
                                          You
                                        </span>
                                      ) : null}
                                      {masterType ? (
                                        <span className='rounded-md bg-brand px-2 py-0.5 text-[8px] font-bold text-white uppercase tracking-wider'>
                                          {formatMasterTypeLabel(masterType)}
                                        </span>
                                      ) : null}
                                    </div>

                                    <p className='mt-1 text-sm text-muted-foreground'>
                                      {[
                                        staff.position?.trim(),
                                        staff.division?.trim(),
                                        staff.email?.trim(),
                                      ]
                                        .filter(Boolean)
                                        .join(' · ') || 'Staff account'}
                                    </p>

                                    <div className='mt-2 flex flex-wrap gap-1.5'></div>
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </section>
                  </div>
                </ScrollArea>
              </Tabs.Panel>
            </div>
          </div>
        </Tabs.Root>
      </DialogContent>
    </Dialog>
  )
}
