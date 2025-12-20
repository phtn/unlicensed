/**
 * Client-side utilities for managing Firebase custom claims
 * 
 * These functions call the server-side API routes that use firebase-admin
 * to set custom claims. Custom claims can only be set server-side for security.
 */

export interface CustomClaims {
  [key: string]: string | number | boolean | string[] | undefined
}

/**
 * Set custom claims for a user
 * 
 * @param uid - Firebase user ID
 * @param claims - Custom claims object
 * @returns Updated custom claims
 */
export async function setCustomClaims(
  uid: string,
  claims: CustomClaims,
): Promise<CustomClaims> {
  const response = await fetch(`/api/admin/users/${uid}/claims`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({claims}),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to set custom claims')
  }

  const data = await response.json()
  return data.customClaims || {}
}

/**
 * Get custom claims for a user
 * 
 * @param uid - Firebase user ID
 * @returns Current custom claims
 */
export async function getCustomClaims(uid: string): Promise<CustomClaims> {
  const response = await fetch(`/api/admin/users/${uid}/claims`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to get custom claims')
  }

  const data = await response.json()
  return data.customClaims || {}
}

/**
 * Remove all custom claims from a user
 * 
 * @param uid - Firebase user ID
 */
export async function removeCustomClaims(uid: string): Promise<void> {
  const response = await fetch(`/api/admin/users/${uid}/claims`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to remove custom claims')
  }
}

