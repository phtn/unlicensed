/**
 * Utility functions for rewards points calculation
 */

/**
 * Calculate the recency multiplier based on days since last payment
 * @param daysSinceLastPayment Number of days since last payment (undefined/null means first order)
 * @returns Multiplier value (3x, 2x, 1.75x, 1.5x, or 1x)
 */
export function calculateRecencyMultiplier(
  daysSinceLastPayment: number | undefined | null,
): number {
  // First order - use 1x multiplier (could be changed to 3x for first-time customers)
  if (daysSinceLastPayment === undefined || daysSinceLastPayment === null) {
    return 1.0
  }

  // 3x within 14 days (2 weeks)
  if (daysSinceLastPayment <= 14) {
    return 3.0
  }

  // 2x within 21 days (3 weeks)
  if (daysSinceLastPayment <= 21) {
    return 2.0
  }

  // 1.75x within 28 days (4 weeks)
  if (daysSinceLastPayment <= 28) {
    return 1.75
  }

  // 1.5x within 35 days (5 weeks)
  if (daysSinceLastPayment <= 35) {
    return 1.5
  }

  // 1x over 35 days
  return 1.0
}

/**
 * Calculate points earned based on eligible spending and multiplier
 * @param eligibleSpendingCents Eligible spending amount in cents
 * @param multiplier Recency multiplier
 * @returns Points earned (rounded to nearest integer)
 */
export function calculatePointsEarned(
  eligibleSpendingCents: number,
  multiplier: number,
): number {
  // Convert cents to dollars, then multiply by multiplier
  const points = (eligibleSpendingCents / 100) * multiplier
  // Round to nearest integer
  return Math.round(points)
}

/**
 * Get days since last payment date
 * @param lastPaymentDate Timestamp of last payment (milliseconds since epoch)
 * @returns Number of days since last payment, or undefined if no last payment
 */
export function getDaysSinceLastPayment(
  lastPaymentDate: number | undefined | null,
): number | undefined {
  if (lastPaymentDate === undefined || lastPaymentDate === null) {
    return undefined
  }

  const now = Date.now()
  const diffMs = now - lastPaymentDate
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return diffDays
}
