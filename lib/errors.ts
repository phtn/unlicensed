/**
 * Convex error handling utilities — shared between server (convex/) and client.
 *
 * Architecture:
 *   - ConvexError<AppErrorData>  → data always reaches the client in both dev and prod
 *   - plain Error                → message is REDACTED in production ("Server Error")
 *
 * Usage:
 *   Server:  throw createAppError('not_found', 'Product not found')
 *   Client:  const msg = getAppErrorMessage(err)  // null if not an AppError
 */

import {ConvexError} from 'convex/values'

// ---------------------------------------------------------------------------
// Error kinds — add new kinds here as the app grows
// ---------------------------------------------------------------------------

export type AppErrorKind =
  | 'auth'       // Unauthenticated / session expired
  | 'forbidden'  // Authenticated but not allowed
  | 'not_found'  // Resource does not exist
  | 'validation' // Invalid input
  | 'conflict'   // Duplicate / state conflict
  | 'payment'    // Payment processing failure
  | 'external'   // Third-party API error
  | 'rate_limit' // Too many requests

// ---------------------------------------------------------------------------
// Shared data shape carried inside ConvexError
// ---------------------------------------------------------------------------

export type AppErrorData = {
  kind: AppErrorKind
  message: string
  /** Optional machine-readable sub-code for the client to branch on */
  code?: string
}

// ---------------------------------------------------------------------------
// Server helpers (safe to import from convex/ functions)
// ---------------------------------------------------------------------------

/** Throw this for user-facing errors. The data is visible to the client in all envs. */
export function createAppError(
  kind: AppErrorKind,
  message: string,
  code?: string,
): ConvexError<AppErrorData> {
  return new ConvexError<AppErrorData>({kind, message, ...(code ? {code} : {})})
}

// Convenience shorthands
export const authError = (msg = 'You must be signed in.') =>
  createAppError('auth', msg)

export const forbiddenError = (msg = 'You do not have permission to do this.') =>
  createAppError('forbidden', msg)

export const notFoundError = (resource: string) =>
  createAppError('not_found', `${resource} not found.`)

export const validationError = (msg: string, code?: string) =>
  createAppError('validation', msg, code)

export const conflictError = (msg: string) =>
  createAppError('conflict', msg)

export const paymentError = (msg: string, code?: string) =>
  createAppError('payment', msg, code)

export const externalError = (msg: string, code?: string) =>
  createAppError('external', msg, code)

// ---------------------------------------------------------------------------
// Client helpers (safe to import in React components / hooks)
// ---------------------------------------------------------------------------

/** Returns true when `err` is a structured AppError (optionally filtered by kind). */
export function isAppError(
  err: unknown,
  kind?: AppErrorKind,
): err is ConvexError<AppErrorData> {
  if (!(err instanceof ConvexError)) return false
  const d = err.data
  if (
    typeof d !== 'object' ||
    d === null ||
    !('kind' in d) ||
    !('message' in d) ||
    typeof (d as AppErrorData).message !== 'string'
  )
    return false
  if (kind !== undefined && (d as AppErrorData).kind !== kind) return false
  return true
}

/**
 * Extracts the user-facing message from a ConvexError<AppErrorData>.
 * Returns null for unrecognised / internal errors so callers can fall back
 * to a generic "something went wrong" message.
 */
export function getAppErrorMessage(err: unknown): string | null {
  if (!isAppError(err)) return null
  return (err.data as AppErrorData).message
}

/**
 * Extracts the full AppErrorData from an error.
 * Returns null for unrecognised / internal errors.
 */
export function getAppError(err: unknown): AppErrorData | null {
  if (!isAppError(err)) return null
  return err.data as AppErrorData
}

/**
 * Returns a display-safe message regardless of error type.
 * - AppError   → structured message (always visible)
 * - plain Error in dev → error.message
 * - plain Error in prod → fallback (the real message was redacted by Convex)
 */
export function toDisplayMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  const appMsg = getAppErrorMessage(err)
  if (appMsg) return appMsg

  if (process.env.NODE_ENV !== 'production' && err instanceof Error) {
    return err.message
  }

  return fallback
}
