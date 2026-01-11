'use server'

import {deleteCookie, getCookie, setCookie} from '@/app/actions'

/**
 * Server Action to get PIN access cookie
 */
export async function getPinAccessCookie(): Promise<string | undefined> {
  return await getCookie('rfac')
}

/**
 * Server Action to set PIN access cookie
 */
export async function setPinAccessCookie(pin: string) {
  await setCookie('rfac', pin.toUpperCase())
}

/**
 * Server Action to delete PIN access cookie
 */
export async function deletePinAccessCookie() {
  await deleteCookie('rfac')
}
