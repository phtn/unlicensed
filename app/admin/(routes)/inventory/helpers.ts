export const extractImageDetails = (fileName: string) => {
  const details = fileName.split('-sq-')
  return {
    name: details[0].split('-').join(' '),
    size: details[1]?.split('.')[0],
    type: details[1]?.split('.')[1],
  }
}

export const normalizeTag = (value: string) => value.trim().toLowerCase()

export const titleCaseTag = (value: string) =>
  value
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')

export const summarizeStorageId = (value: string) =>
  value.length <= 18 ? value : `${value.slice(0, 8)}...${value.slice(-6)}`
