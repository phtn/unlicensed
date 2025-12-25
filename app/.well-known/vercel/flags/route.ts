import {createFlagsDiscoveryEndpoint, getProviderData} from 'flags/next'
import {buildTypeFlag, delayFlag} from '@/lib/flags'
import {NextRequest} from 'next/server'

const flags = {
  delay: delayFlag,
  buildType: buildTypeFlag,
}

const getApiData = async (_request: NextRequest) => {
  return getProviderData(flags)
}

export const GET = createFlagsDiscoveryEndpoint(getApiData)

