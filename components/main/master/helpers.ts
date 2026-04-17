import type {EmailBlast, EmailBlastStatus} from '@/convex/emailBlasts/d'
import type {MasterEntry} from '@/lib/master-monitor-access'

export function formatMasterTypeLabel(type: MasterEntry['type']) {
  return type
}

export function formatDateTime(value: number | undefined) {
  if (!value) return 'N/A'

  return new Date(value).toLocaleString()
}

export function getBlastTone(status: EmailBlastStatus) {
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

export function getBlastProgress(blast: EmailBlast) {
  if (blast.totalRecipients <= 0) return 0

  return (blast.processedRecipients / blast.totalRecipients) * 100
}
