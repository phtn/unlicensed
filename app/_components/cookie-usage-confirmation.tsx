'use client'

import Link from 'next/link'
import {useState} from 'react'

const CONSENT_VERSION = 'v1'
const COOKIE_NAME = 'rf-cookie-usage'
const COOKIE_VALUE = CONSENT_VERSION
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

function hasConfirmedCookieUsage() {
  return document.cookie
    .split(';')
    .some((cookie) => cookie.trim().startsWith(`${COOKIE_NAME}=`))
}

function confirmCookieUsage() {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${COOKIE_NAME}=${COOKIE_VALUE}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`
}

export function CookieUsageConfirmation() {
  const [isVisible, setIsVisible] = useState(
    () => typeof document !== 'undefined' && !hasConfirmedCookieUsage(),
  )

  if (!isVisible) {
    return null
  }

  return (
    <section
      aria-label='Cookie usage notice'
      className='fixed bottom-3 left-3 z-9997 w-[min(calc(100vw-1.5rem),24rem)] overflow-hidden rounded-none border border-white/14 bg-zinc-950/88 text-white shadow-[0_1.5rem_5rem_rgba(0,0,0,0.38)] backdrop-blur-2xl motion-safe:animate-[cookie-confirmation-in_420ms_cubic-bezier(0.22,1,0.36,1)_both] sm:bottom-5 sm:left-5'>
      <div className='pointer-events-none absolute -left-20 -top-24 size-52 rounded-full bg-brand/35 blur-3xl' />
      <div className='pointer-events-none absolute -bottom-20 right-0 size-44 rounded-full bg-white/14 blur-3xl' />
      <div className='relative p-4 sm:p-5'>
        <div className='mb-3 flex items-center gap-2'>
          <span className='size-2.5 rounded-full bg-brand shadow-[0_0_1.5rem_var(--brand)]' />
          <p className='font-brk text-[0.65rem] uppercase tracking-[0.28em] text-white/58'>
            Site Memory
          </p>
        </div>
        <h2 className='font-clash text-xl leading-none tracking-tight text-white sm:text-2xl'>
          Cookie Usage
        </h2>
        <p className='mt-2 max-w-[36ch] font-polysans text-sm leading-5 text-white/68'>
          We use first-party cookies and local storage for sign-in, cart state,
          preferences, and site reliability.
        </p>
        <div className='mt-4 flex items-center gap-2'>
          <button
            type='button'
            onClick={() => {
              confirmCookieUsage()
              setIsVisible(false)
            }}
            className='rounded-none bg-white px-6 h-7 text-sm font-semibold text-zinc-950 transition hover:bg-white/88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950'>
            Got it
          </button>
          <Link
            href='/privacy-policy'
            className='rounded-full px-6 py-1 h-7 text-sm font-medium text-white/62 transition hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950'>
            Privacy
          </Link>
        </div>
      </div>
    </section>
  )
}
