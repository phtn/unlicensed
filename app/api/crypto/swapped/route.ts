import {swappedServer} from '@/lib/swapped/server'
import {NextRequest, NextResponse} from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {category, method, params} = body

    if (!category || !method) {
      return NextResponse.json(
        {success: false, message: 'Category and method are required'},
        {status: 400},
      )
    }

    console.log(category, method, params)

    let result: unknown

    switch (category) {
      case 'orders':
        if (method === 'list') {
          result = await swappedServer.orders.list(params)
        } else if (method === 'get') {
          if (!params?.orderId) throw new Error('Order ID is required')
          result = await swappedServer.orders.get(params.orderId)
        } else if (method === 'refund') {
          if (!params?.orderId) throw new Error('Order ID is required')
          result = await swappedServer.orders.refund(params.orderId, {
            amount: params.amount,
            reason: params.reason,
          })
        }
        break

      case 'paymentLinks':
        if (method === 'create') {
          result = await swappedServer.paymentLinks.create(params)
        }
        break

      case 'paymentRoutes':
        if (method === 'create') {
          result = await swappedServer.paymentRoutes.create(params)
        }
        break

      case 'payments':
        if (method === 'get') {
          if (!params?.paymentId) throw new Error('Payment ID is required')
          result = await swappedServer.payments.get(params.paymentId)
        }
        break

      case 'balances':
        if (method === 'list') {
          result = await swappedServer.balances.list(params)
        } else if (method === 'get') {
          if (!params?.currencyId) throw new Error('Currency ID is required')
          result = await swappedServer.balances.get(params.currencyId)
        }
        break

      case 'quotes':
        if (method === 'get') {
          if (
            !params?.fromAmount ||
            !params?.fromFiatCurrency ||
            !params?.toCurrency ||
            !params?.toBlockchain
          ) {
            throw new Error(
              'From amount, from fiat currency, to currency, and to blockchain are required',
            )
          }
          result = await swappedServer.quotes.get({
            fromAmount: params.fromAmount,
            fromFiatCurrency: params.fromFiatCurrency,
            toCurrency: params.toCurrency,
            toBlockchain: params.toBlockchain,
          })
        }
        break

      case 'currencies':
        if (method === 'list') {
          result = await swappedServer.currencies.list()
        }
        break

      case 'blockchains':
        if (method === 'list') {
          result = await swappedServer.blockchains.list()
        }
        break

      case 'payouts':
        if (method === 'create') {
          result = await swappedServer.payouts.create(params)
        } else if (method === 'list') {
          result = await swappedServer.payouts.list(params)
        } else if (method === 'get') {
          if (!params?.payoutId) throw new Error('Payout ID is required')
          result = await swappedServer.payouts.get(params.payoutId)
        }
        break

      case 'kyc':
        if (method === 'getStatus') {
          if (!params?.customerId) throw new Error('Customer ID is required')
          result = await swappedServer.kyc.getStatus(params.customerId)
        } else if (method === 'submit') {
          result = await swappedServer.kyc.submit(params)
        }
        break

      default:
        return NextResponse.json(
          {success: false, message: `Unknown category: ${category}`},
          {status: 400},
        )
    }

    return NextResponse.json(result)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      {success: false, message: errorMessage, error: errorMessage},
      {status: 500},
    )
  }
}
