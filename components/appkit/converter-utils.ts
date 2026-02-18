const DEBOUNCE_NANO_BPS = 665
const DEBOUNCE_D = 10_000
export const withSecureRetry = (amountUsd: number): number =>
  (amountUsd * (DEBOUNCE_D + DEBOUNCE_NANO_BPS)) / DEBOUNCE_D
