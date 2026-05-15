'use client'

import {cn} from '@/lib/utils'
import gsap from 'gsap'
import {startTransition, useEffect, useRef, useState} from 'react'

const SUPPORT_DAYS = 'Monday-Friday'
const COMPACT_SUPPORT_DAYS = 'Mon - Fri'
const EASTERN_TIME_ZONE = 'America/New_York'
const SUPPORT_START_HOUR_ET = 11
const SUPPORT_END_HOUR_ET = 20
const DEFAULT_SUPPORT_HOURS = {
  full: '11AM-8PM',
  compact: '11-8PM',
}

const US_TIME_ZONE_LABELS: Record<string, string> = {
  'America/New_York': 'ET',
  'America/Detroit': 'ET',
  'America/Indiana/Indianapolis': 'ET',
  'America/Indiana/Vevay': 'ET',
  'America/Indiana/Vincennes': 'ET',
  'America/Indiana/Winamac': 'ET',
  'America/Kentucky/Louisville': 'ET',
  'America/Kentucky/Monticello': 'ET',
  'America/Chicago': 'CT',
  'America/Indiana/Knox': 'CT',
  'America/Indiana/Tell_City': 'CT',
  'America/Menominee': 'CT',
  'America/North_Dakota/Beulah': 'CT',
  'America/North_Dakota/Center': 'CT',
  'America/North_Dakota/New_Salem': 'CT',
  'America/Denver': 'MT',
  'America/Boise': 'MT',
  'America/Phoenix': 'MST',
  'America/Los_Angeles': 'PT',
  'America/Anchorage': 'AKT',
  'America/Juneau': 'AKT',
  'America/Metlakatla': 'AKT',
  'America/Nome': 'AKT',
  'America/Sitka': 'AKT',
  'America/Yakutat': 'AKT',
  'America/Adak': 'HAT',
  'Pacific/Honolulu': 'HT',
} as const

function getBrowserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return null
  }
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .flatMap((part) =>
        part.type === 'literal' ? [] : [[part.type, Number(part.value)]],
      ),
  )

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
  }
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string) {
  const parts = getTimeZoneParts(date, timeZone)
  const zoneTimeAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  )

  return (zoneTimeAsUtc - date.getTime()) / 60000
}

function getEasternWallClockDate(hour: number) {
  const now = new Date()
  const easternToday = getTimeZoneParts(now, EASTERN_TIME_ZONE)
  const utcGuess = Date.UTC(
    easternToday.year,
    easternToday.month - 1,
    easternToday.day,
    hour,
  )
  const easternOffset = getTimeZoneOffsetMinutes(
    new Date(utcGuess),
    EASTERN_TIME_ZONE,
  )

  return new Date(utcGuess - easternOffset * 60000)
}

function formatHour(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    hour12: true,
  })
    .format(date)
    .replace(/\s/g, '')
}

function getSupportHours() {
  const browserTimeZone = getBrowserTimeZone()
  const timeZone =
    browserTimeZone && US_TIME_ZONE_LABELS[browserTimeZone]
      ? browserTimeZone
      : EASTERN_TIME_ZONE
  const startHour = formatHour(
    getEasternWallClockDate(SUPPORT_START_HOUR_ET),
    timeZone,
  )
  const endHour = formatHour(
    getEasternWallClockDate(SUPPORT_END_HOUR_ET),
    timeZone,
  )

  return {
    full: `${startHour}-${endHour}`,
    compact: `${startHour.replace(/AM$/, '')}-${endHour}`,
  }
}

export const ChatSupportHours = () => {
  const rootRef = useRef<HTMLDivElement>(null)
  const lastScrollY = useRef(0)
  const [supportHours, setSupportHours] = useState(DEFAULT_SUPPORT_HOURS)
  const [isCompact, setIsCompact] = useState(
    () => typeof window !== 'undefined' && window.scrollY > 24,
  )

  useEffect(() => {
    startTransition(() => {
      setSupportHours(getSupportHours())
    })
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-support-hours-child]',
        {
          autoAlpha: 0,
          x: 10,
        },
        {
          autoAlpha: 1,
          x: 0,
          duration: 0.45,
          ease: 'power3.out',
          stagger: 0.08,
          delay: 0.15,
        },
      )
    }, root)

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const nextScrollY = window.scrollY
      const isScrollingDown = nextScrollY > lastScrollY.current

      if (nextScrollY <= 24) {
        setIsCompact(false)
      } else if (isScrollingDown) {
        setIsCompact(true)
      }

      lastScrollY.current = nextScrollY
    }

    lastScrollY.current = window.scrollY
    window.addEventListener('scroll', handleScroll, {passive: true})

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    gsap.to(root, {
      width: isCompact ? 170 : 215,
      duration: 0.28,
      ease: 'power2.out',
    })
  }, [isCompact])

  return (
    <div
      ref={rootRef}
      className={cn(
        'fixed -right-1 bottom-3 md:bottom-7 flex h-15 w-60 items-center overflow-hidden rounded-full bg-black/25 px-4 text-balance text-white shadow-lg backdrop-blur-sm',
        isCompact ? 'space-x-5' : 'space-x-5',
      )}>
      <div
        data-support-hours-child
        className='flex h-12 shrink-0 flex-col justify-center leading-4'>
        <p className='leading-4 text-xl font-semibold'>Chat</p>
        <p className='leading-4 text-sm opacity-90'>Support</p>
      </div>
      <div
        data-support-hours-child
        className='flex h-12 min-w-0 flex-col items-center justify-center leading-4 tracking-wide'>
        <p className='whitespace-nowrap font-clash text-sm opacity-90'>
          {isCompact ? COMPACT_SUPPORT_DAYS : SUPPORT_DAYS}
        </p>
        <p
          className={cn(
            'whitespace-nowrap font-clash font-medium text-sm tracking-widest opacity-65',
            isCompact && 'tracking-wider',
          )}>
          {isCompact ? supportHours.compact : supportHours.full}
        </p>
      </div>
    </div>
  )
}
