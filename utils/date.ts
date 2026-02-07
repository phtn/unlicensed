import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  format,
} from 'date-fns'

export const formatTimestamp = (timestamp: number | string | undefined) => {
  if (!timestamp) return null
  const date = new Date(timestamp)
  const now = new Date()

  const seconds = differenceInSeconds(now, date)
  const minutes = differenceInMinutes(now, date)
  const hours = differenceInHours(now, date)
  const days = differenceInDays(now, date)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return format(date, 'MMM d, h:mm a')
}

export const formatDate = (timestamp: number) => {
  return format(new Date(timestamp), 'MMM d, yyyy, h:mm a')
}

/** Compact time format for message timestamps (e.g. "2:30 PM") */
export const formatTimeCompact = (timestamp: number | string | undefined) => {
  if (!timestamp) return ''
  return format(new Date(timestamp), 'h:mm a')
}

export const formatDateFn = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return dateString
  }
}
