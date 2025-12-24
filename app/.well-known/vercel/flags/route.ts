import {createFlagsDiscoveryEndpoint, getProviderData} from 'flags/next'
import {delayFlag} from '@/lib/flags'
import {NextRequest} from 'next/server'

const flags = {
  delay: delayFlag,
}

const getApiData = async (_request: NextRequest) => {
  return getProviderData(flags)
}

export const GET = createFlagsDiscoveryEndpoint(getApiData)

