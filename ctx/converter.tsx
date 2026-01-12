'use client'

import {parseAsString, useQueryStates} from 'nuqs'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'

export interface ConverterParams {
  amount: string
  fromCurrency: string
  toCurrency: string
  toBlockchain: string
  toAmount: string
  toAmountUsdc: string
}

interface ConverterParamsContextValue {
  params: ConverterParams
  setAmount: (value: string) => void
  setFromCurrency: (value: string) => void
  setToCurrency: (value: string) => void
  setToBlockchain: (value: string) => void
  setToAmount: (value: string) => void
  setToAmountUsdc: (value: string) => void
  setParams: (updates: Partial<ConverterParams>) => void
}

const ConverterParamsContext =
  createContext<ConverterParamsContextValue | null>(null)

export function ConverterParamsProvider({children}: {children: ReactNode}) {
  const [params, setParams] = useQueryStates(
    {
      amount: parseAsString.withDefault('5000'),
      fromCurrency: parseAsString.withDefault('PHP'),
      toCurrency: parseAsString.withDefault('USDC'),
      toBlockchain: parseAsString.withDefault('ethereum'),
      toAmount: parseAsString.withDefault(''),
      toAmountUsdc: parseAsString.withDefault(''),
    },
    {
      history: 'push',
      shallow: false,
    },
  )

  const setAmount = useCallback(
    (value: string) => {
      setParams((prev) => ({...prev, amount: value}))
    },
    [setParams],
  )

  const setFromCurrency = useCallback(
    (value: string) => {
      setParams((prev) => ({...prev, fromCurrency: value}))
    },
    [setParams],
  )

  const setToCurrency = useCallback(
    (value: string) => {
      setParams((prev) => ({...prev, toCurrency: value}))
    },
    [setParams],
  )

  const setToBlockchain = useCallback(
    (value: string) => {
      setParams((prev) => ({...prev, toBlockchain: value}))
    },
    [setParams],
  )

  const setToAmount = useCallback(
    (value: string) => {
      setParams((prev) => ({...prev, toAmount: value}))
    },
    [setParams],
  )

  const setToAmountUsdc = useCallback(
    (value: string) => {
      setParams((prev) => ({...prev, toAmountUsdc: value}))
    },
    [setParams],
  )

  const value: ConverterParamsContextValue = useMemo(
    () => ({
      params,
      setAmount,
      setFromCurrency,
      setToCurrency,
      setToBlockchain,
      setToAmount,
      setToAmountUsdc,
      setParams,
    }),
    [
      params,
      setAmount,
      setFromCurrency,
      setToCurrency,
      setToBlockchain,
      setToAmount,
      setToAmountUsdc,
      setParams,
    ],
  )

  return (
    <ConverterParamsContext.Provider value={value}>
      {children}
    </ConverterParamsContext.Provider>
  )
}

export function useConverterParams(): ConverterParamsContextValue {
  const context = useContext(ConverterParamsContext)
  if (!context) {
    throw new Error(
      'useConverterParams must be used within ConverterParamsProvider',
    )
  }
  return context
}
