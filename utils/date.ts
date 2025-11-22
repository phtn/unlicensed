import { format, differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns'

export const formatTimestamp = (timestamp: number) => {
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
