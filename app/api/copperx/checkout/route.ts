import {createClient} from '@/lib/copperx'
import {CreateCheckoutSessionParams} from 'copperx-fn'
import {NextRequest, NextResponse} from 'next/server'
import {after} from 'next/server'

export const POST = async (req: NextRequest) => {
  try {
    const payload: CreateCheckoutSessionParams = await req.json()
    const client = createClient()

    // Log payload after response (non-blocking)
    after(async () => {
      console.log('PAYLOAD', payload)
    })

    const {checkoutSession} = await client.checkoutSessions.create(payload)

    return NextResponse.json({data: checkoutSession}, {status: 200})
  } catch (error) {
    console.error('CopperX checkout error:', error)
    return NextResponse.json(
      {
        error: 'An error occurred',
        message: error,
      },
      {status: 500},
    )
  }
}
