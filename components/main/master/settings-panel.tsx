'use client'

import {useAuthCtx} from '@/ctx/auth'
import type {MasterEntry} from '@/lib/master-monitor-access'
import {useCallback, useEffect, useState} from 'react'
import {formatMasterTypeLabel} from './helpers'
import {PanelContainer} from './panel-container'

type AdminClaimUser = {uid: string; email: string | undefined}

interface SettingsPanelProps {
  canManageAdminClaims: boolean
  enabled: boolean
  masterEntries: MasterEntry[]
}

export const SettingsPanel = ({
  canManageAdminClaims,
  enabled,
  masterEntries,
}: SettingsPanelProps) => {
  return (
    <PanelContainer tabValue='settings'>
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
        </section>

        {canManageAdminClaims ? (
          <AdminClaimsPanel enabled={enabled} />
        ) : null}
      </div>
    </PanelContainer>
  )
}

const AdminClaimsPanel = ({enabled}: {enabled: boolean}) => {
  const {user} = useAuthCtx()
  const [adminClaimUsers, setAdminClaimUsers] = useState<AdminClaimUser[]>([])
  const [adminClaimLookup, setAdminClaimLookup] = useState('')
  const [adminClaimLoading, setAdminClaimLoading] = useState(false)
  const [adminClaimGrantLoading, setAdminClaimGrantLoading] = useState(false)
  const [adminClaimError, setAdminClaimError] = useState<string | null>(null)

  const fetchAdminClaimUsers = useCallback(async () => {
    if (!user) return

    setAdminClaimLoading(true)
    setAdminClaimError(null)
    try {
      const idToken = await user.getIdToken()
      const res = await fetch('/api/admin/master-monitor/admin-claim', {
        headers: {Authorization: `Bearer ${idToken}`},
      })
      const data = await res.json()
      if (res.ok) {
        setAdminClaimUsers(data.adminUsers ?? [])
      } else {
        setAdminClaimError(data.error ?? 'Failed to load admin claim users')
      }
    } catch {
      setAdminClaimError('Failed to load admin claim users')
    } finally {
      setAdminClaimLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!enabled) return

    void fetchAdminClaimUsers()
  }, [enabled, fetchAdminClaimUsers])

  const handleGrantAdminClaim = useCallback(async () => {
    const lookup = adminClaimLookup.trim()
    if (!lookup || !user) return

    setAdminClaimGrantLoading(true)
    setAdminClaimError(null)
    try {
      const idToken = await user.getIdToken()
      const res = await fetch('/api/admin/master-monitor/admin-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({uid: lookup}),
      })
      const data = await res.json()
      if (res.ok) {
        setAdminClaimLookup('')
        await fetchAdminClaimUsers()
      } else {
        setAdminClaimError(
          data.message ?? data.error ?? 'Failed to grant admin claim',
        )
      }
    } catch {
      setAdminClaimError('Failed to grant admin claim')
    } finally {
      setAdminClaimGrantLoading(false)
    }
  }, [adminClaimLookup, fetchAdminClaimUsers, user])

  const handleRevokeAdminClaim = useCallback(
    async (uid: string) => {
      if (!user) return

      setAdminClaimError(null)
      try {
        const idToken = await user.getIdToken()
        const res = await fetch('/api/admin/master-monitor/admin-claim', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({uid}),
        })
        const data = await res.json()
        if (res.ok) {
          await fetchAdminClaimUsers()
        } else {
          setAdminClaimError(
            data.message ?? data.error ?? 'Failed to revoke admin claim',
          )
        }
      } catch {
        setAdminClaimError('Failed to revoke admin claim')
      }
    },
    [fetchAdminClaimUsers, user],
  )

  return (
    <section className='bg-card/70 p-4'>
      <p className='text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase'>
        Admin Claims
      </p>
      <p className='mt-1 text-sm text-muted-foreground'>
        Firebase users with{' '}
        <code className='rounded bg-muted px-1 py-0.5 text-xs'>
          admin: true
        </code>{' '}
        custom claim.
      </p>

      <div className='mt-4 flex gap-2'>
        <input
          className='flex-1 rounded border border-border/60 bg-background/80 px-3 py-1.5 text-sm outline-none focus:border-brand/60'
          placeholder='Firebase UID or email'
          value={adminClaimLookup}
          onChange={(e) => setAdminClaimLookup(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleGrantAdminClaim()
          }}
        />
        <button
          onClick={() => void handleGrantAdminClaim()}
          disabled={!adminClaimLookup.trim() || adminClaimGrantLoading}
          className='rounded bg-brand px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50'>
          {adminClaimGrantLoading ? 'Granting…' : 'Grant'}
        </button>
      </div>

      {adminClaimError ? (
        <p className='mt-2 text-sm text-red-500'>{adminClaimError}</p>
      ) : null}

      <div className='mt-4 space-y-2'>
        {adminClaimLoading ? (
          <p className='text-sm text-muted-foreground'>Loading…</p>
        ) : adminClaimUsers.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            No users have the admin claim.
          </p>
        ) : (
          adminClaimUsers.map((adminUser) => (
            <div
              key={adminUser.uid}
              className='flex items-center justify-between gap-3 bg-background/70 px-3 py-2 text-sm'>
              <div className='min-w-0'>
                <p className='truncate font-medium'>
                  {adminUser.email ?? adminUser.uid}
                </p>
                <p className='truncate text-xs text-muted-foreground'>
                  {adminUser.uid}
                </p>
              </div>
              <button
                onClick={() => void handleRevokeAdminClaim(adminUser.uid)}
                className='shrink-0 rounded border border-red-500/40 px-2 py-1 text-xs text-red-500 hover:bg-red-500/10'>
                Revoke
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
