'use client'

import {Id} from '@/convex/_generated/dataModel'
import {PaymentMethod} from '@/convex/orders/d'
import {AddressType} from '@/convex/users/d'
import {PlaceOrderParams} from '@/hooks/use-place-order'
import {formatPrice} from '@/utils/formatPrice'
import {
  Button,
  Card,
  CardBody,
  Divider,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Textarea,
} from '@heroui/react'
import {useRouter} from 'next/navigation'
import {useEffect, useMemo, useState} from 'react'

interface OrderSummaryProps {
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
  userPhone?: string
  orderError: Error | null
  orderId: Id<'orders'> | null
  onCheckoutClose: VoidFunction
  isCheckoutOpen: boolean
  onClearCart: () => Promise<void>
}

export const OrderSummary = ({
  subtotal,
  tax,
  shipping,
  total,
  isAuthenticated,
  onOpen,
  isLoading = false,
  onPlaceOrder,
  userEmail,
  defaultAddress,
  userPhone,
  orderError,
  orderId,
  onCheckoutClose,
  isCheckoutOpen,
  onClearCart,
}: OrderSummaryProps) => {
  const router = useRouter()

  // Check if we have all required info to auto-place order
  const hasAllRequiredInfo = useMemo(() => {
    return !!(
      userEmail &&
      userPhone &&
      defaultAddress &&
      defaultAddress.addressLine1 &&
      defaultAddress.city &&
      defaultAddress.state &&
      defaultAddress.zipCode
    )
  }, [userEmail, userPhone, defaultAddress])

  const [formData, setFormData] = useState({
    contactEmail: userEmail ?? '',
    contactPhone: userPhone ?? defaultAddress?.phone ?? '',
    paymentMethod: 'credit_card' as PaymentMethod,
    customerNotes: '',
    // Shipping address
    firstName: defaultAddress?.firstName ?? '',
    lastName: defaultAddress?.lastName ?? '',
    addressLine1: defaultAddress?.addressLine1 ?? '',
    addressLine2: defaultAddress?.addressLine2 ?? '',
    city: defaultAddress?.city ?? '',
    state: defaultAddress?.state ?? '',
    zipCode: defaultAddress?.zipCode ?? '',
    country: defaultAddress?.country ?? 'US',
    // Billing address (optional)
    useSameBilling: true,
    billingFirstName: '',
    billingLastName: '',
    billingAddressLine1: '',
    billingAddressLine2: '',
    billingCity: '',
    billingState: '',
    billingZipCode: '',
    billingCountry: 'US',
  })

  // Update form when user email or default address changes
  // useEffect(() => {
  //   if (userEmail) {
  //   }
  //   if (defaultAddress) {
  //     setFormData((prev) => ({
  //       ...prev,
  //       email: userEmail ?? '',
  //       firstName: defaultAddress.firstName ?? '',
  //       lastName: defaultAddress.lastName ?? '',
  //       addressLine1: defaultAddress.addressLine1 ?? '',
  //       addressLine2: defaultAddress.addressLine2 ?? '',
  //       city: defaultAddress.city ?? '',
  //       state: defaultAddress.state ?? '',
  //       zipCode: defaultAddress.zipCode ?? '',
  //       country: defaultAddress.country ?? 'US',
  //       contactPhone: userPhone ?? defaultAddress.phone ?? '',
  //     }))
  //   }
  // }, [userEmail, userPhone, defaultAddress, setEmail])

  // Handle successful order
  useEffect(() => {
    if (orderId) {
      // Clear the cart after successful order placement
      const clearCartAndRedirect = async () => {
        try {
          await onClearCart()
          if (process.env.NODE_ENV === 'development') {
            console.log('[OrderSummary] Cart cleared after successful order')
          }
        } catch (error) {
          console.error('[OrderSummary] Failed to clear cart:', error)
          // Continue with redirect even if cart clearing fails
        }

        // Redirect to order detail page
        setTimeout(() => {
          router.push(`/account/orders/${orderId}`)
          onCheckoutClose()
        }, 1500)
      }

      clearCartAndRedirect()
    }
  }, [orderId, router, onCheckoutClose, onClearCart])

  // Auto-place order if we have all required info
  const handlePlaceOrderClick = async () => {
    if (hasAllRequiredInfo && defaultAddress) {
      // Auto-place order with saved info
      const shippingAddress: AddressType = {
        ...defaultAddress,
        id: defaultAddress.id ?? `shipping-${Date.now()}`,
        type: 'shipping',
      }

      await onPlaceOrder({
        shippingAddress,
        contactEmail: userEmail,
        contactPhone: userPhone,
        paymentMethod: 'credit_card', // Default payment method
        subtotalCents: subtotal,
        taxCents: tax,
        shippingCents: shipping,
      })
    } else {
      // Show form if info is missing
      onOpen()
    }
  }

  const handlePlaceOrder = async () => {
    // Validate required fields
    if (!formData.contactEmail) {
      alert('Please enter your email address')
      return
    }
    if (!formData.firstName || !formData.lastName) {
      alert('Please enter your full name')
      return
    }
    if (
      !formData.addressLine1 ||
      !formData.city ||
      !formData.state ||
      !formData.zipCode
    ) {
      alert('Please complete your shipping address')
      return
    }

    const shippingAddress: AddressType = {
      id: `shipping-${Date.now()}`,
      type: 'shipping',
      firstName: formData.firstName,
      lastName: formData.lastName,
      addressLine1: formData.addressLine1,
      addressLine2: formData.addressLine2 ?? undefined,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      country: formData.country,
      phone: formData.contactPhone ?? undefined,
    }

    const billingAddress: AddressType | undefined = formData.useSameBilling
      ? undefined
      : {
          id: `billing-${Date.now()}`,
          type: 'billing',
          firstName: formData.billingFirstName,
          lastName: formData.billingLastName,
          addressLine1: formData.billingAddressLine1,
          addressLine2: formData.billingAddressLine2 || undefined,
          city: formData.billingCity,
          state: formData.billingState,
          zipCode: formData.billingZipCode,
          country: formData.billingCountry,
        }

    await onPlaceOrder({
      shippingAddress,
      billingAddress,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone || undefined,
      paymentMethod: formData.paymentMethod,
      customerNotes: formData.customerNotes || undefined,
      subtotalCents: subtotal,
      taxCents: tax,
      shippingCents: shipping,
    })
  }

  return (
    <>
      <div className='lg:sticky lg:top-24 h-fit'>
        <Card>
          <CardBody className='space-y-4 p-8'>
            <h2 className='text-xl font-semibold'>Order Summary</h2>
            <Divider />
            <div className='space-y-2 font-space'>
              <div className='flex justify-between text-sm'>
                <span className='text-color-muted'>Subtotal</span>
                <span>${formatPrice(subtotal)}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-color-muted'>Tax</span>
                <span>${formatPrice(tax)}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-color-muted'>Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <span className='text-teal-500'>Free</span>
                  ) : (
                    `$${formatPrice(shipping)}`
                  )}
                </span>
              </div>
            </div>
            <Divider />
            <div className='flex justify-between text-lg font-semibold font-space'>
              <span>Total</span>
              <span>${formatPrice(total)}</span>
            </div>
            {!isAuthenticated && (
              <div className='p-3 bg-warning/10 border border-warning/20 rounded-lg'>
                <p className='text-sm text-warning'>
                  Sign in to proceed to checkout
                </p>
              </div>
            )}
            <Button
              size='lg'
              radius='sm'
              variant='solid'
              className='w-full font-semibold bg-foreground text-background'
              onPress={handlePlaceOrderClick}
              isDisabled={!isAuthenticated || isLoading}
              isLoading={isLoading}>
              {orderId ? 'Order Placed!' : 'Place Order'}
            </Button>
            <Button
              radius='sm'
              variant='flat'
              className='w-full'
              as={Link}
              href='/'>
              Continue Shopping
            </Button>
          </CardBody>
        </Card>
      </div>

      {/* Checkout Modal */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={onCheckoutClose}
        size='2xl'
        scrollBehavior='inside'
        placement='center'>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className='flex flex-col gap-1'>
                Complete Your Order
              </ModalHeader>
              <ModalBody>
                {orderError && (
                  <div className='p-3 bg-danger/10 border border-danger/20 rounded-lg'>
                    <p className='text-sm text-danger'>
                      {orderError.message ||
                        'Failed to place order. Please try again.'}
                    </p>
                  </div>
                )}

                {orderId && (
                  <div className='p-3 bg-success/10 border border-success/20 rounded-lg'>
                    <p className='text-sm text-success'>
                      Order placed successfully! Redirecting...
                    </p>
                  </div>
                )}

                <div className='space-y-6'>
                  {/* Contact Information */}
                  <div>
                    <h3 className='text-lg font-semibold mb-4'>
                      Contact Information
                    </h3>
                    <div className='space-y-4'>
                      <Input
                        label='Email'
                        type='email'
                        value={formData.contactEmail}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contactEmail: e.target.value,
                          }))
                        }
                        isRequired
                      />
                      <Input
                        label='Phone'
                        type='tel'
                        value={formData.contactPhone}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contactPhone: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <Divider />

                  {/* Shipping Address */}
                  <div>
                    <h3 className='text-lg font-semibold mb-4'>
                      Shipping Address
                    </h3>
                    <div className='grid grid-cols-2 gap-4'>
                      <Input
                        label='First Name'
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        isRequired
                      />
                      <Input
                        label='Last Name'
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        isRequired
                      />
                    </div>
                    <div className='mt-4 space-y-4'>
                      <Input
                        label='Address Line 1'
                        value={formData.addressLine1}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            addressLine1: e.target.value,
                          }))
                        }
                        isRequired
                      />
                      <Input
                        label='Address Line 2 (Optional)'
                        value={formData.addressLine2}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            addressLine2: e.target.value,
                          }))
                        }
                      />
                      <div className='grid grid-cols-3 gap-4'>
                        <Input
                          label='City'
                          value={formData.city}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              city: e.target.value,
                            }))
                          }
                          isRequired
                        />
                        <Input
                          label='State'
                          value={formData.state}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              state: e.target.value,
                            }))
                          }
                          isRequired
                        />
                        <Input
                          label='ZIP Code'
                          value={formData.zipCode}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              zipCode: e.target.value,
                            }))
                          }
                          isRequired
                        />
                      </div>
                      <Input
                        label='Country'
                        value={formData.country}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            country: e.target.value,
                          }))
                        }
                        isRequired
                      />
                    </div>
                  </div>

                  <Divider />

                  {/* Payment Method */}
                  <div>
                    <h3 className='text-lg font-semibold mb-4'>
                      Payment Method
                    </h3>
                    <Select
                      label='Payment Method'
                      selectedKeys={[formData.paymentMethod]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string
                        setFormData((prev) => ({
                          ...prev,
                          paymentMethod: selected as PaymentMethod,
                        }))
                      }}>
                      <SelectItem key='credit_card'>Credit Card</SelectItem>
                      <SelectItem key='debit_card'>Debit Card</SelectItem>
                      <SelectItem key='paypal'>PayPal</SelectItem>
                      <SelectItem key='apple_pay'>Apple Pay</SelectItem>
                      <SelectItem key='google_pay'>Google Pay</SelectItem>
                      <SelectItem key='bank_transfer'>Bank Transfer</SelectItem>
                      <SelectItem key='cash'>Cash on Delivery</SelectItem>
                    </Select>
                  </div>

                  {/* Customer Notes */}
                  <div>
                    <h3 className='text-lg font-semibold mb-4'>
                      Additional Notes (Optional)
                    </h3>
                    <Textarea
                      label='Special Instructions'
                      placeholder='Any special delivery instructions or notes...'
                      value={formData.customerNotes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customerNotes: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant='light'
                  onPress={onClose}
                  isDisabled={isLoading}>
                  Cancel
                </Button>
                <Button
                  color='primary'
                  onPress={handlePlaceOrder}
                  isLoading={isLoading}
                  isDisabled={!!orderId}>
                  {orderId ? 'Order Placed!' : 'Place Order'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}
