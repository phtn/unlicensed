'use server'

import {getFirebaseStaffServerSession} from '@/lib/firebase/server-auth'
import {decipherGuestTrackingIpNetworkHash} from '@/lib/guest-tracking/ip-network-hash'

export async function decipherGuestVisitorIpNetworkHash(
  hash: string | null | undefined,
) {
  const session = await getFirebaseStaffServerSession()
  if (!session) {
    throw new Error('Unauthorized')
  }

  return await decipherGuestTrackingIpNetworkHash(hash)
}
