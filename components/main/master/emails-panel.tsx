'use client'

import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {cn} from '@/lib/utils'
import {ProgressBar} from '@heroui/react'
import {useQuery} from 'convex/react'
import {formatDateTime, getBlastProgress, getBlastTone} from './helpers'
import {PanelContainer} from './panel-container'

type EmailBlast = Doc<'emailBlasts'>

const ACTIVE_BLAST_ARGS = {limit: 4}
const RECENT_BLAST_ARGS = {limit: 6}

export const EmailsPanel = ({enabled}: {enabled: boolean}) => {
  const activeBlasts = useQuery(
    api.emailBlasts.q.listActive,
    enabled ? ACTIVE_BLAST_ARGS : 'skip',
  )
  const recentBlasts = useQuery(
    api.emailBlasts.q.listRecent,
    enabled ? RECENT_BLAST_ARGS : 'skip',
  )
  const latestBlast = activeBlasts?.[0] ?? recentBlasts?.[0] ?? null

  return (
    <PanelContainer tabValue='emails'>
      <div className='space-y-4 p-2 grid grid-cols-1 gap-4'>
        <section>
          <div className=''>
            <div className='bg-card/70 p-2'>
              <p className='font-clash font-medium text-sm tracking-[0.18em] uppercase'>
                Mail Status
              </p>
              <p className='mt-1 text-sm text-muted-foreground'>
                Background email blasts now keep running even if the sender
                leaves the email page.
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
              These runs continue in the background after the sender leaves the
              email screen.
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
    </PanelContainer>
  )
}

const BlastCard = ({blast}: {blast: EmailBlast}) => {
  return (
    <div className='bg-background/70 p-4'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='space-y-1'>
          <p className='font-medium text-foreground/90'>
            {blast.templateTitle}
          </p>
          <div className='flex items-center space-x-4 text-sm text-muted-foreground'>
            <span>{blast.mailingListName}</span>
            <span>Sent {blast.sentRecipients}</span>
            <span>Failed {blast.failedRecipients}</span>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex rounded-sm border px-2 py-1 text-[8px] font-medium uppercase tracking-[0.12em]',
            getBlastTone(blast.status),
          )}>
          {blast.status}
        </span>
      </div>

      <div className='mt-2'>
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
