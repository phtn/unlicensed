import {NextRequest, NextResponse} from 'next/server'

const CMC_QUOTES_URL =
  'https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest'

const FIAT_CURRENCIES = [
  {id: 'usd', symbol: 'USD', name: 'US Dollar'},
  {id: 'eur', symbol: 'EUR', name: 'Euro'},
  {id: 'cad', symbol: 'CAD', name: 'Canadian Dollar'},
  {id: 'gbp', symbol: 'GBP', name: 'British Pound'},
  {id: 'aud', symbol: 'AUD', name: 'Australian Dollar'},
  {id: 'jpy', symbol: 'JPY', name: 'Japanese Yen'},
  {id: 'chf', symbol: 'CHF', name: 'Swiss Franc'},
  {id: 'cny', symbol: 'CNY', name: 'Chinese Yuan'},
  {id: 'inr', symbol: 'INR', name: 'Indian Rupee'},
  {id: 'brl', symbol: 'BRL', name: 'Brazilian Real'},
  {id: 'mxn', symbol: 'MXN', name: 'Mexican Peso'},
  {id: 'sgd', symbol: 'SGD', name: 'Singapore Dollar'},
  {id: 'hkd', symbol: 'HKD', name: 'Hong Kong Dollar'},
  {id: 'nzd', symbol: 'NZD', name: 'New Zealand Dollar'},
  {id: 'zar', symbol: 'ZAR', name: 'South African Rand'},
  {id: 'sek', symbol: 'SEK', name: 'Swedish Krona'},
  {id: 'nok', symbol: 'NOK', name: 'Norwegian Krone'},
  {id: 'dkk', symbol: 'DKK', name: 'Danish Krone'},
  {id: 'pln', symbol: 'PLN', name: 'Polish Zloty'},
  {id: 'try', symbol: 'TRY', name: 'Turkish Lira'},
  {id: 'php', symbol: 'PHP', name: 'Philippine Peso'},
]

const CRYPTO_CURRENCIES = [
  {id: 'btc', cmcId: 1, symbol: 'BTC', name: 'Bitcoin'},
  {id: 'eth', cmcId: 1027, symbol: 'ETH', name: 'Ethereum'},
  {id: 'sol', cmcId: 5426, symbol: 'SOL', name: 'Solana'},
  {id: 'usdc', cmcId: 3408, symbol: 'USDC', name: 'USDC'},
  {id: 'usdt', cmcId: 825, symbol: 'USDT', name: 'Tether USDt'},
  {id: 'bnb', cmcId: 1839, symbol: 'BNB', name: 'BNB'},
  {id: 'ada', cmcId: 2010, symbol: 'ADA', name: 'Cardano'},
  {id: 'dot', cmcId: 6636, symbol: 'DOT', name: 'Polkadot'},
  {id: 'avax', cmcId: 5805, symbol: 'AVAX', name: 'Avalanche'},
  {id: 'matic', cmcId: 3890, symbol: 'MATIC', name: 'Polygon'},
  {id: 'pol', cmcId: 28321, symbol: 'POL', name: 'Polygon Ecosystem Token'},
  {id: 'link', cmcId: 1975, symbol: 'LINK', name: 'Chainlink'},
  {id: 'uni', cmcId: 7083, symbol: 'UNI', name: 'Uniswap'},
  {id: 'xrp', cmcId: 52, symbol: 'XRP', name: 'XRP'},
  {id: 'ltc', cmcId: 2, symbol: 'LTC', name: 'Litecoin'},
  {id: 'doge', cmcId: 74, symbol: 'DOGE', name: 'Dogecoin'},
  {id: 'trx', cmcId: 1958, symbol: 'TRX', name: 'TRON'},
  {id: 'atom', cmcId: 3794, symbol: 'ATOM', name: 'Cosmos'},
  {id: 'arb', cmcId: 11841, symbol: 'ARB', name: 'Arbitrum'},
  {id: 'ton', cmcId: 11419, symbol: 'TON', name: 'Toncoin'},
  {id: 'bch', cmcId: 1831, symbol: 'BCH', name: 'Bitcoin Cash'},
  {id: 'dai', cmcId: 4943, symbol: 'DAI', name: 'Dai'},
  {id: 'osmo', cmcId: 12220, symbol: 'OSMO', name: 'Osmosis'},
  {id: 'shib', cmcId: 5994, symbol: 'SHIB', name: 'Shiba Inu'},
  {id: 'sand', cmcId: 6210, symbol: 'SAND', name: 'The Sandbox'},
  {id: 'ape', cmcId: 18876, symbol: 'APE', name: 'ApeCoin'},
  {id: 'op', cmcId: 11840, symbol: 'OP', name: 'Optimism'},
]

const BLOCKCHAINS = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    currencies: [
      'ETH',
      'USDC',
      'USDT',
      'DAI',
      'LINK',
      'UNI',
      'SHIB',
      'SAND',
      'APE',
    ],
  },
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'POL',
    currencies: ['POL', 'MATIC', 'USDC', 'USDT', 'DAI'],
  },
  {
    id: 'polygon-amoy',
    name: 'Polygon Amoy',
    symbol: 'POL',
    currencies: ['POL', 'MATIC', 'USDC', 'USDT', 'DAI'],
  },
  {id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', currencies: ['BTC']},
  {id: 'litecoin', name: 'Litecoin', symbol: 'LTC', currencies: ['LTC']},
  {id: 'solana', name: 'Solana', symbol: 'SOL', currencies: ['SOL', 'USDC']},
  {
    id: 'avalanche',
    name: 'Avalanche',
    symbol: 'AVAX',
    currencies: ['AVAX', 'USDC', 'USDT'],
  },
  {id: 'binance', name: 'Binance', symbol: 'BNB', currencies: ['BNB', 'USDT']},
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    symbol: 'ARB',
    currencies: ['ARB', 'ETH', 'USDC', 'USDT'],
  },
  {
    id: 'optimism',
    name: 'Optimism',
    symbol: 'OP',
    currencies: ['OP', 'ETH', 'USDC', 'USDT'],
  },
  {id: 'base', name: 'Base', symbol: 'ETH', currencies: ['ETH', 'USDC']},
  {id: 'tron', name: 'Tron', symbol: 'TRX', currencies: ['TRX', 'USDT']},
  {id: 'xrp', name: 'XRP', symbol: 'XRP', currencies: ['XRP']},
  {id: 'ton', name: 'TON', symbol: 'TON', currencies: ['TON']},
  {
    id: 'bitcoin-cash',
    name: 'Bitcoin-Cash',
    symbol: 'BCH',
    currencies: ['BCH'],
  },
  {id: 'cardano', name: 'Cardano', symbol: 'ADA', currencies: ['ADA']},
  {id: 'polkadot', name: 'Polkadot', symbol: 'DOT', currencies: ['DOT']},
  {id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', currencies: ['DOGE']},
  {id: 'cosmos', name: 'Cosmos', symbol: 'ATOM', currencies: ['ATOM']},
  {id: 'osmosis', name: 'Osmosis', symbol: 'OSMO', currencies: ['OSMO']},
]

const USDC_CMC_ID = 3408

interface ConverterRequestBody {
  category?: string
  method?: string
  params?: {
    fromAmount?: string
    fromFiatCurrency?: string
    toCurrency?: string
    toBlockchain?: string
  }
}

interface CmcStatus {
  error_code: number
  error_message: string | null
}

interface CmcPrice {
  price?: number
}

interface CmcAssetQuote {
  id: number
  name: string
  symbol: string
  quote?: Record<string, CmcPrice>
}

interface CmcQuotesResponse {
  status: CmcStatus
  data?: Record<string, CmcAssetQuote>
}

function successResponse<T>(data: T) {
  return NextResponse.json({success: true, data})
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({success: false, message, error: message}, {status})
}

function getApiKey() {
  return process.env.CMC_API_KEY?.trim()
}

function findFiatCurrency(symbol: string | undefined) {
  if (!symbol) return null

  const normalized = symbol.trim().toUpperCase()
  return FIAT_CURRENCIES.find((currency) => currency.symbol === normalized)
}

function findCryptoCurrency(symbol: string | undefined) {
  if (!symbol) return null

  const normalized = symbol.trim().toUpperCase()
  return CRYPTO_CURRENCIES.find((currency) => currency.symbol === normalized)
}

function getPrice(
  asset: CmcAssetQuote | undefined,
  fiatSymbol: string,
): number | null {
  const price = asset?.quote?.[fiatSymbol]?.price
  return typeof price === 'number' && Number.isFinite(price) && price > 0
    ? price
    : null
}

async function fetchQuotes({
  apiKey,
  cmcIds,
  fiatSymbol,
}: {
  apiKey: string
  cmcIds: number[]
  fiatSymbol: string
}) {
  const url = new URL(CMC_QUOTES_URL)
  url.searchParams.set('id', cmcIds.join(','))
  url.searchParams.set('convert', fiatSymbol)

  const response = await fetch(url, {
    headers: {
      'X-CMC_PRO_API_KEY': apiKey,
      Accept: 'application/json',
    },
    next: {revalidate: 60},
  })

  const result = (await response.json()) as CmcQuotesResponse

  if (!response.ok) {
    throw new Error(
      result.status?.error_message ??
        `CoinMarketCap API returned ${response.status}`,
    )
  }

  if (result.status.error_code !== 0) {
    throw new Error(
      result.status.error_message ?? 'CoinMarketCap returned an error',
    )
  }

  return result.data ?? {}
}

async function getQuote(params: ConverterRequestBody['params']) {
  const apiKey = getApiKey()

  if (!apiKey) {
    return errorResponse('CMC_API_KEY is not configured', 500)
  }

  const amount = Number.parseFloat(params?.fromAmount ?? '')
  if (!Number.isFinite(amount) || amount <= 0) {
    return errorResponse('From amount must be a positive number')
  }

  const fiat = findFiatCurrency(params?.fromFiatCurrency)
  if (!fiat) {
    return errorResponse('Unsupported fiat currency')
  }

  const targetCurrency = findCryptoCurrency(params?.toCurrency)
  if (!targetCurrency) {
    return errorResponse('Unsupported cryptocurrency')
  }

  const cmcIds =
    targetCurrency.cmcId === USDC_CMC_ID
      ? [targetCurrency.cmcId]
      : [targetCurrency.cmcId, USDC_CMC_ID]

  const quotes = await fetchQuotes({
    apiKey,
    cmcIds,
    fiatSymbol: fiat.symbol,
  })

  const targetPrice = getPrice(quotes[String(targetCurrency.cmcId)], fiat.symbol)
  if (!targetPrice) {
    return errorResponse(
      `CoinMarketCap did not return a ${fiat.symbol} price for ${targetCurrency.symbol}`,
      502,
    )
  }

  const toAmount = amount / targetPrice
  const rate = toAmount / amount
  const usdcPrice =
    targetCurrency.cmcId === USDC_CMC_ID
      ? targetPrice
      : getPrice(quotes[String(USDC_CMC_ID)], fiat.symbol)
  const toAmountUsdc = usdcPrice ? amount / usdcPrice : undefined
  const rateUsdc = toAmountUsdc ? toAmountUsdc / amount : undefined

  return successResponse({
    fromAmount: {
      amount: params?.fromAmount,
      currency: fiat.symbol,
    },
    toAmount: {
      beforeFees: toAmount.toString(),
      afterFees: toAmount.toString(),
      currency: targetCurrency.symbol,
    },
    rate: rate.toString(),
    toAmountUsdc: toAmountUsdc?.toString(),
    rateUsdc: rateUsdc?.toString(),
    source: 'coinmarketcap',
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ConverterRequestBody
    const {category, method, params} = body

    if (!category || !method) {
      return errorResponse('Category and method are required')
    }

    if (category === 'currencies' && method === 'list') {
      return successResponse({
        currencies: [
          ...FIAT_CURRENCIES.map((currency) => ({
            id: currency.id,
            symbol: currency.symbol,
            name: currency.name,
            type: 'FIAT',
          })),
          ...CRYPTO_CURRENCIES.map((currency) => ({
            id: currency.id,
            symbol: currency.symbol,
            name: currency.name,
            type: 'CRYPTO',
          })),
        ],
      })
    }

    if (category === 'blockchains' && method === 'list') {
      return successResponse({blockchains: BLOCKCHAINS})
    }

    if (category === 'quotes' && method === 'get') {
      if (
        !params?.fromAmount ||
        !params?.fromFiatCurrency ||
        !params?.toCurrency ||
        !params?.toBlockchain
      ) {
        return errorResponse(
          'From amount, from fiat currency, to currency, and to blockchain are required',
        )
      }

      return await getQuote(params)
    }

    return errorResponse(`Unsupported CoinMarketCap operation: ${category}.${method}`)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred'
    return errorResponse(message, 500)
  }
}
