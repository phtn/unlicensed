/**
 * User-friendly messages for Firebase Authentication error codes.
 * Covers client-side (Web/JS) and common Admin API codes that surface to the client.
 * @see https://firebase.google.com/docs/auth/admin/errors
 * @see https://cloud.google.com/identity-platform/docs/error-codes
 */
const FIREBASE_AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Account / credential
  'auth/account-exists-with-different-credential':
    'An account already exists with the same email but a different sign-in method. Try signing in with your existing provider.',
  'auth/credential-already-in-use':
    'This sign-in method is already linked to another account.',
  'auth/email-already-in-use':
    'This email is already in use. Try signing in or use a different email.',
  'auth/invalid-credential':
    'Sign-in failed. The link or credentials may have expired. Please try again.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled':
    'This account has been disabled. Please contact support.',
  'auth/user-not-found':
    'No account found with this email. You may need to sign up first.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  'auth/email-change-needs-verification':
    'Please verify your email before changing it.',
  'auth/requires-recent-login':
    'For your security, please sign in again before continuing.',

  // Provider / operation
  'auth/operation-not-allowed':
    'This sign-in method is not enabled. Please contact support.',
  'auth/popup-closed-by-user':
    'Sign-in was cancelled. Please try again when you’re ready.',
  'auth/popup-blocked':
    'Sign-in popup was blocked. Allow popups for this site and try again.',
  'auth/cancelled-popup-request':
    'Another sign-in attempt is in progress. Please wait or try again.',
  'auth/unauthorized-domain': 'Domain not authorized. Please contact support.',
  'auth/app-not-authorized':
    'This app is not authorized to sign in. Check your app configuration.',

  // Rate limit / network
  'auth/too-many-requests':
    'Too many attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed':
    'Network error. Check your connection and try again.',

  // Email link
  'auth/expired-action-code':
    'This sign-in link has expired. Request a new one.',
  'auth/invalid-action-code':
    'This sign-in link is invalid or has already been used. Request a new one.',
  'auth/invalid-message-payload':
    'Something went wrong sending the email. Please try again.',
  'auth/invalid-recipient-email':
    'This email address cannot receive sign-in links.',
  'auth/invalid-sender':
    'Email sending is misconfigured. Please contact support.',
  'auth/missing-ios-bundle-id':
    'App configuration error. Please contact support.',
  'auth/missing-continue-uri':
    'App configuration error. Please contact support.',
  'auth/missing-android-pkg-name':
    'App configuration error. Please contact support.',
  'auth/unauthorized-continue-uri':
    'The redirect URL is not allowed. Please contact support.',

  // Phone (for completeness)
  'auth/missing-phone-number': 'Please enter a phone number.',
  'auth/invalid-phone-number': 'Please enter a valid phone number.',
  'auth/missing-verification-code': 'Please enter the verification code.',
  'auth/invalid-verification-code':
    'Invalid or expired code. Please try again.',
  'auth/missing-verification-id':
    'Verification session expired. Please start again.',
  'auth/invalid-verification-id':
    'Verification session invalid. Please start again.',
  'auth/code-expired': 'Verification code expired. Please request a new one.',
  'auth/captcha-check-failed': 'Security check failed. Please try again.',
  'auth/quota-exceeded': 'Too many requests. Please try again later.',

  // Multi-factor (for completeness)
  'auth/multi-factor-auth-required':
    'Additional verification is required. Please complete the next step.',
  'auth/missing-multi-factor-session': 'Session expired. Please sign in again.',
  'auth/missing-multi-factor-info':
    'Verification info missing. Please try again.',
  'auth/invalid-multi-factor-session':
    'Verification session invalid. Please sign in again.',
  'auth/multi-factor-info-not-found':
    'Verification method not found. Please try again.',
  'auth/second-factor-already-in-use':
    'This verification method is already in use.',
  'auth/maximum-second-factor-count-exceeded':
    'Maximum number of verification methods reached.',
  'auth/unsupported-first-factor':
    'This sign-in method does not support this verification.',

  // Token / session
  'auth/user-token-expired': 'Your session has expired. Please sign in again.',
  'auth/invalid-user-token': 'Your session is invalid. Please sign in again.',
  'auth/id-token-expired': 'Your session has expired. Please sign in again.',
  'auth/id-token-revoked': 'Your session was revoked. Please sign in again.',
  'auth/session-cookie-expired':
    'Your session has expired. Please sign in again.',
  'auth/session-cookie-revoked':
    'Your session was revoked. Please sign in again.',

  // App / config
  'auth/app-deleted':
    'This app is no longer available. Please contact support.',
  'auth/invalid-api-key': 'App configuration error. Please contact support.',
  'auth/argument-error': 'Something went wrong. Please try again.',
  'auth/internal-error':
    'Something went wrong on our side. Please try again later.',
  'auth/web-storage-unsupported':
    'Sign-in is not supported in this browser. Try a different browser or device.',
  'auth/claims-too-large': 'Request too large. Please try again.',
  'auth/invalid-claims': 'Invalid request. Please try again.',
  'auth/reserved-claims': 'Invalid request. Please try again.',
  'auth/project-not-found': 'App configuration error. Please contact support.',
  'auth/maximum-user-count-exceeded':
    'Service limit reached. Please try again later.',
  'auth/insufficient-permission': 'Permission denied. Please contact support.',
}

/** Error shape from Firebase JS Auth (has code and message). */
interface FirebaseAuthErrorLike {
  code?: string
  message?: string
}

/**
 * Extracts Firebase auth error code from an error (code property or "auth/..." in message).
 */
function getAuthErrorCode(error: unknown): string | null {
  if (error && typeof error === 'object') {
    const obj = error as FirebaseAuthErrorLike
    if (typeof obj.code === 'string' && obj.code.startsWith('auth/')) {
      return obj.code
    }
    if (typeof obj.message === 'string') {
      const match = obj.message.match(/\b(auth\/[a-z0-9-]+)\b/i)
      if (match) return match[1]
    }
  }
  return null
}

/**
 * Parses a Firebase Authentication error into a user-friendly message.
 * Use this for any error thrown by Firebase Auth (signInWithPopup, sendSignInLinkToEmail, etc.).
 *
 * @param error - Caught error (Error, Firebase Auth error, or unknown)
 * @returns User-friendly message; falls back to generic message or original message
 */
export function parseFirebaseAuthError(error: unknown): string {
  const code = getAuthErrorCode(error)
  if (code && FIREBASE_AUTH_ERROR_MESSAGES[code]) {
    return FIREBASE_AUTH_ERROR_MESSAGES[code]
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as {message: unknown}).message === 'string'
  ) {
    return (error as {message: string}).message
  }
  return 'Something went wrong. Please try again.'
}
