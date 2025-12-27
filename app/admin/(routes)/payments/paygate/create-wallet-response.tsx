'use client'

import {ApiResponse} from '@/lib/paygate/types'
import {ResponseDisplay} from './components'

interface CreateWalletResponseProps {
  response: ApiResponse | null
}

export const CreateWalletResponse = ({response}: CreateWalletResponseProps) => {
  // Handlers for each form

  return <ResponseDisplay response={response} />
}
