/**
 * Checks if a string contains only numeric characters
 */
export function isOnlyNumbers(value: string): boolean {
  return /^\d+$/.test(value)
}

