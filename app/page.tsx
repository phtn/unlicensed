import {PinAccessGate} from './_components/pin-access-gate'
import {api} from '@/convex/_generated/api'
import {ConvexHttpClient} from 'convex/browser'
import {redirect} from 'next/navigation'

export const dynamic = 'force-dynamic'

function isAccessCodeEnabled(
  haltPass: {value?: {enabled?: unknown}} | null,
): boolean {
  return haltPass?.value?.enabled !== false
}

const _convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? null

const convex = _convexUrl ? new ConvexHttpClient(_convexUrl) : null

export default async function RootPage() {
  if (convex) {
    let haltPass: {value?: {enabled?: unknown}} | null = null

    try {
      haltPass = await convex.query(api.admin.q.getHaltPass, {})
    } catch (error) {
      console.error('Failed to load halt gate config:', error)
    }

    if (haltPass && !isAccessCodeEnabled(haltPass)) {
      redirect('/lobby')
    }
  }

  return <PinAccessGate />
}
