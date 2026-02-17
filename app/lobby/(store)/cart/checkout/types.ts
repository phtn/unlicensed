import {Doc, Id} from '@/convex/_generated/dataModel'
import {PaymentMethod} from '@/convex/orders/d'
import {AddressType} from '@/convex/users/d'
import {PlaceOrderParams} from '@/hooks/use-place-order'
import {PointsBalance} from '../rewards-summary'

export interface CheckoutProps {
  subtotal: number
  tax: number
  shipping: number
  total: number
  isAuthenticated: boolean
  onOpen: VoidFunction
  isLoading?: boolean
  onPlaceOrder: (params: PlaceOrderParams) => Promise<Id<'orders'> | null>
  userEmail: string
  defaultAddress?: AddressType
  defaultBillingAddress?: AddressType
  userPhone?: string
  cashAppUsername?: string
  convexUser?: Doc<'users'> | null
  orderError: Error | null
  orderId: Id<'orders'> | null
  onCheckoutClose: VoidFunction
  isCheckoutOpen: boolean
  onClearCart: () => Promise<void>
  pointsBalance: PointsBalance | undefined
  paymentMethodFromUrl?: PaymentMethod
  onPaymentMethodUrlChange?: (method: PaymentMethod) => void
  minimumOrderCents?: number
  shippingFeeCents?: number
}

export interface FormData {
  contactEmail: string
  contactPhone: string
  paymentMethod: PaymentMethod
  // Shipping address
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zipCode: string
  country: string
  // Billing address (optional)
  useSameBilling: boolean
  billingFirstName: string
  billingLastName: string
  billingAddressLine1: string
  billingAddressLine2: string
  billingCity: string
  billingState: string
  billingZipCode: string
  billingCountry: string
  cashAppUsername: string
}

export interface FormErrors {
  contactEmail?: string
  firstName?: string
  lastName?: string
  addressLine1?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  billingFirstName?: string
  billingLastName?: string
  billingAddressLine1?: string
  billingCity?: string
  billingState?: string
  billingZipCode?: string
  billingCountry?: string
  cashAppUsername?: string
}
