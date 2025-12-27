export interface CreateWalletResponseData {
  address_in: string
  polygon_address_in: string
  callback_url: string
  ipn_token: string
}

export type FiatCurrency =
  | 'USD'
  | 'EUR'
  | 'CAD'
  | 'GBP'
  | 'AUD'
  | 'JPY'
  | 'CHF'
  | 'CNY'
  | 'INR'
  | 'BRL'
  | 'MXN'
  | 'SGD'
  | 'HKD'
  | 'NZD'
  | 'ZAR'
  | 'SEK'
  | 'NOK'
  | 'DKK'
  | 'PLN'
  | 'TRY'
  | 'PHP'
