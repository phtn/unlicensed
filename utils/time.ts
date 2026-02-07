export const formatRecordingTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const formatTimeCompact = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})
}
