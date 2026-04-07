import {PinAccessGate} from './_components/pin-access-gate'
import {api} from '@/convex/_generated/api'
import {ConvexHttpClient} from 'convex/browser'
import {unstable_cache} from 'next/cache'
import {redirect} from 'next/navigation'

export const dynamic = 'force-dynamic'

function isAccessCodeEnabled(
  haltPass: {value?: {enabled?: unknown}} | null,
): boolean {
  return haltPass?.value?.enabled !== false
}

const _convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? null

const fetchHaltPass = _convexUrl
  ? unstable_cache(
      async () => {
        const convex = new ConvexHttpClient(_convexUrl)
        return convex.query(api.admin.q.getHaltPass, {})
      },
      ['root-halt-pass'],
      {revalidate: 30},
    )
  : null

export default async function RootPage() {
  if (fetchHaltPass) {
    try {
      const haltPass = await fetchHaltPass()

      if (!isAccessCodeEnabled(haltPass)) {
        redirect('/lobby')
      }
    } catch (error) {
      console.error('Failed to load halt gate config:', error)
    }
  }

  return <PinAccessGate />
}
