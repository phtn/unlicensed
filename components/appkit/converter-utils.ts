const DEBOUNCE_NANO_BPS = Number(
  process.env.NEXT_PUBLIC_DEBOUNCE_NANO_BPS ?? 675,
)
const DEBOUNCE_D = 10_000
export const withSecureRetry = (entry: number): number =>
  (entry * (DEBOUNCE_D + DEBOUNCE_NANO_BPS)) / DEBOUNCE_D
