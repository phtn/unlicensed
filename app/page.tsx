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

export default async function RootPage() {
  const convexUrl =
    process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? null

  if (convexUrl) {
    try {
      const convex = new ConvexHttpClient(convexUrl)
      const haltPass = await convex.query(api.admin.q.getHaltPass, {})

      if (!isAccessCodeEnabled(haltPass)) {
        redirect('/lobby')
      }
    } catch (error) {
      console.error('Failed to load halt gate config:', error)
    }
  }

  return <PinAccessGate />
}
