import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

export type PaymentSuccessEmailProps = {
  customerName: string
  planLabel: string
  orderNumber: string
  amount: number | null
  currency: string | null
  cardId: string | null
  dashboardUrl: string
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
  planLabel,
  orderNumber,
  amount,
  currency,
  cardId,
  dashboardUrl,
}: PaymentSuccessEmailProps) => (
  <Html>
    <Preview>Payment Received! We are now processing your order.</Preview>
    <Tailwind>
      <Head />
      <Body className='bg-[#f6f8fc] py-8 font-sans text-[#0f172a]'>
        <Container className='mx-auto max-w-140 rounded-2xl bg-white px-8 py-10 shadow-[0_8px_40px_rgba(15,23,42,0.08)]'>
          <Section className='mb-8 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-6 py-6 text-white'>
            <Text className='m-0 text-[14px] uppercase tracking-[0.12em] opacity-85'>
              Payment Received!
            </Text>
            <Text className='m-0 mt-2 text-[30px] leading-9 font-semibold'>
              Rapid Fire Order Number: {orderNumber}
            </Text>
            <Text className='m-0 mt-3 text-[15px] leading-5.5 opacity-90'>
              Thanks {customerName}, your {planLabel} purchase is complete and
              your digital profile experience is ready.
            </Text>
          </Section>

          <Section className='rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-5 py-4'>
            <Text className='m-0 text-[13px] leading-5 text-[#475569]'>
              Amount paid: <strong>{formatCurrency(amount, currency)}</strong>
            </Text>
            <Text className='m-0 mt-2 text-[13px] leading-5 text-[#475569]'>
              Reference #: <strong>{orderNumber}</strong>
            </Text>
            {cardId ? (
              <Text className='m-0 mt-2 text-[13px] leading-5 text-[#475569]'>
                Assigned card: <strong>{cardId}</strong>
              </Text>
            ) : null}
            <Text className='m-0 mt-2 text-[13px] leading-5 text-[#475569]'>
              Status: <strong>We are now processing your order.</strong>
            </Text>
          </Section>

          <Section className='text-center mt-7'>
            <Button
              href={dashboardUrl}
              className='inline-block rounded-full bg-[#0f172a] px-6 py-3 text-[14px] font-semibold text-white no-underline'>
              Open Account Dashboard
            </Button>
          </Section>

          <Text className='mb-0 mt-8 text-[14px] leading-5.5 text-[#334155]'>
            We are excited to have you on board. If you need help getting set
            up, just reply to this email and our team will assist right away.
          </Text>

          <Hr className='my-7 border-[#e2e8f0]' />

          <Text className='m-0 text-[12px] leading-4.5 text-[#64748b]'>
            Rapid Fire · Where fast minds Thrive.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
