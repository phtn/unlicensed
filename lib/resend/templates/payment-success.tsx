import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import {type PaymentMethod} from '../../../convex/orders/d'
import {FooterEmailContent} from './footer'

export type PaymentSuccessEmailProps = {
  customerName: string
  paymentMethod: PaymentMethod
  orderNumber: string
  orderDate: string
  amount: number | null
  currency: string | null
}

const baseUrl =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://rapidfirenow.com'

export const pmap: Record<PaymentMethod, string> = {
  cards: 'Card',
  crypto_transfer: 'Send Crypto',
  crypto_commerce: 'Pay with Crypto',
  cash_app: 'Cash App',
}

const formatCurrency = (amount: number | null, currency: string | null) => {
  if (amount === null || !currency) return 'Paid'
  try {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export const PaymentSuccessEmail = ({
  customerName,
  paymentMethod,
  orderNumber,
  orderDate,
  amount,
  currency,
}: PaymentSuccessEmailProps) => (
  <Html>
    <Preview>Your order is on the way, {customerName}</Preview>
    <Tailwind>
      <Head />
      <Body className='m-0 bg-[#ececec] py-8 font-sans text-[#171717]'>
        <Container className='mx-auto w-full max-w-[640.01px] px-4'>
          <Section className='pb-7 pt-3 text-center'>
            <Img
              src={`https://res.cloudinary.com/dx0heqhhe/image/upload/v1771881178/rf-wordmark-flex_vrgct3.png`}
              alt='Rapid Fire'
              width='180'
              className='mx-auto'
            />
          </Section>

          <Section
            className='overflow-hidden rounded-t-[32.01px] px-8 py-10 text-center text-white'
            style={{
              background:
                'radial-gradient(circle at 50% 62%, rgba(209, 73, 155, 0.95) 0%, rgba(209, 73, 155, 0.82) 28%, rgba(209, 73, 155, 0.8) 58%, rgba(209, 73, 155, 1) 100%)',
            }}>
            <Section
              className='mx-auto w-fit rounded-full bg-white'
              style={{
                paddingLeft: 8,
                paddingRight: 12,
                paddingTop: 6,
                paddingBottom: 6,
              }}>
              <Text className='m-0 text-lg font-clash font-semibold text-[#2f2f2f]'>
                <span
                  style={{
                    display: 'inline-block',
                    width: '32px',
                    height: '32px',
                    lineHeight: '32px',
                    textAlign: 'center',
                    borderRadius: '999px',
                    backgroundColor: '#111111',
                    color: '#ffffff',
                    fontWeight: 800,
                    marginRight: '12px',
                  }}>
                  ✓
                </span>
                Payment Successful!
              </Text>
            </Section>

            <Text
              className='m-0 mt-14 text-center text-[36px] font-black leading-[1.12] tracking-[-0.04em] text-white'
              style={{textShadow: '0 6px 24px rgba(136, 0, 92, 0.38)'}}>
              Your order is on the way!
            </Text>

            <Text className='mx-auto mt-5 max-w-120 text-[16px] leading-[1.7] text-[#efe9ff]'>
              Your payment has been confirmed and we&apos;re already moving your
              order through fulfillment.
            </Text>

            <Section className='mx-auto mt-10 rounded-xl px-6 py-5 text-center bg-black w-[240.01px]'>
              <Link
                href={`${baseUrl}/account/orders/${orderNumber}`}
                className='m-0 text-[18px] font-semibold leading-[1.45] text-white'>
                View Order Status
              </Link>
            </Section>
          </Section>

          <Section className='rounded-b-[22px] bg-white px-7 py-12 text-center shadow-[0_20px_60px_rgba(17,17,17,0.08)]'>
            <Text className='m-0 text-[20px] font-medium leading-1 tracking-[-0.03em] text-[#20123e]'>
              Payment Details
            </Text>
            <Text className='mx-auto mt-4 max-w-[440.01px] text-base leading-[1.7] text-[#5a5a5a]'>
              We&apos;ll keep you posted as your order moves forward.
            </Text>
            <Section className='mt-4 rounded-2xl bg-[#efefef] px-6 py-5 text-left'>
              <Text className='m-0 text-sm font-medium uppercase tracking-[0.12em] text-[#7b70a0]'>
                Order Number
              </Text>
              <Text className='m-0 mt-2 text-[20px] font-bold text-[#26184a]'>
                {orderNumber}
              </Text>
            </Section>
            <Section className='mt-4 rounded-2xl bg-[#efefef] px-6 py-5 text-left'>
              <Text className='m-0 text-sm font-medium uppercase tracking-[0.12em] text-[#7b70a0]'>
                Order Date
              </Text>
              <Text className='m-0 mt-2 text-[20px] font-bold text-[#26184a]'>
                {orderDate}
              </Text>
            </Section>

            <Section className='mt-4 rounded-2xl bg-[#efefef] px-6 py-5 text-left'>
              <Text className='m-0 text-sm font-medium uppercase tracking-[0.12em] text-[#7b70a0]'>
                Payment Method
              </Text>
              <Text className='m-0 mt-2 text-[20px] font-bold text-[#26184a]'>
                {pmap[paymentMethod]}
              </Text>
            </Section>
            <Section className='mt-4 rounded-2xl bg-[#efefef] px-6 py-5 text-left'>
              <Text className='m-0 text-sm font-semibold uppercase tracking-[0.12em] text-[#7b70a0]'>
                Amount paid
              </Text>
              <Text className='m-0 mt-2 text-[22px] font-black text-[#26184a]'>
                {formatCurrency(amount, currency)}
              </Text>
            </Section>
          </Section>
          <FooterEmailContent baseUrl={baseUrl} />
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
