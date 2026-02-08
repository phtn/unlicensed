import type {PaymentMethod} from '@/convex/orders/d'
import {useCallback} from 'react'
import {useQueryState} from 'nuqs'
import {checkoutModalParser, paymentMethodParser} from '../constants'

export function useCartCheckoutQueryState() {
  const [checkoutParam, setCheckoutParam] = useQueryState(
    'checkout',
    checkoutModalParser,
  )
  const [paymentMethod, setPaymentMethod] = useQueryState(
    'payment',
    paymentMethodParser,
  )

  const isCheckoutOpen = checkoutParam === 'open'

  const onCheckoutOpen = useCallback(() => {
    void setCheckoutParam('open')
  }, [setCheckoutParam])

  const onCheckoutClose = useCallback(() => {
    void setCheckoutParam(null)
  }, [setCheckoutParam])

  const onPaymentMethodChange = useCallback(
    (method: PaymentMethod) => {
      void setPaymentMethod(method)
    },
    [setPaymentMethod],
  )

  return {
    isCheckoutOpen,
    onCheckoutOpen,
    onCheckoutClose,
    paymentMethod,
    onPaymentMethodChange,
  }
}
