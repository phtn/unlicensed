import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

const baseUrl =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://rapidfirenow.com'

export type OrderConfirmationEmailProps = {
  customerName: string
  orderNumber: string
  summary: string
  dashboardUrl: string
}

export const OrderConfirmationEmail = ({
  customerName,
  orderNumber,
  summary,
  dashboardUrl,
}: OrderConfirmationEmailProps) => (
  <Html>
    <Preview>Your order has been created, {customerName}</Preview>
    <Tailwind>
      <Head />
      <Body className='m-0 bg-[#ececec] py-8 font-sans text-[#171717]'>
        <Container className='mx-auto w-full max-w-[640.01px] px-4'>
          <Section className='pb-7 pt-3 text-center'>
            <Img
              src={`${baseUrl}/static/rf-wordmark-flex.png`}
              alt='Rapid Fire'
              width='220'
              className='mx-auto'
            />
          </Section>

          <Section
            className='overflow-hidden rounded-[22px] px-8 py-10 text-center text-white'
            style={{
              background:
                'radial-gradient(circle at 50% 62%, rgba(131, 65, 255, 0.95) 0%, rgba(92, 33, 255, 0.82) 28%, rgba(62, 14, 170, 0.94) 58%, rgba(43, 10, 119, 1) 100%)',
            }}>
            <Section className='mx-auto w-fit rounded-full bg-[#f3f3f3] px-6 py-4'>
              <Text className='m-0 text-[16px] font-semibold text-[#2f2f2f]'>
                <span
                  style={{
                    display: 'inline-block',
                    width: '32px',
                    height: '32px',
                    lineHeight: '32px',
                    textAlign: 'center',
                    borderRadius: '999px',
                    backgroundColor: '#cfcfcf',
                    color: '#ffffff',
                    fontWeight: 800,
                    marginRight: '12px',
                  }}>
                  •
                </span>
                Payment pending
              </Text>
            </Section>

            <Text
              className='m-0 mt-14 text-center text-[36px] font-black leading-[1.12] tracking-[-0.04em] text-white'
              style={{textShadow: '0 6px 24px rgba(112, 55, 255, 0.38)'}}>
              Your order has been created, {customerName}!
            </Text>

            <Text className='mx-auto mt-5 max-w-[440.01px] text-[16px] leading-[1.7] text-[#efe9ff]'>
              We&apos;ve received your order and it&apos;s waiting for the next
              payment and processing step.
            </Text>

            <Section
              className='mx-auto mt-10 rounded-[14.01px] px-6 py-5 text-center'
              style={{backgroundColor: 'rgba(50, 9, 134, 0.92)'}}>
              <Text className='m-0 text-[18px] font-semibold leading-[1.45] text-white'>
                Rapid Fire ID: {orderNumber}
              </Text>
            </Section>
          </Section>

          <Section className='rounded-b-[22px] bg-white px-7 py-8 text-center shadow-[0_20px_60px_rgba(17,17,17,0.08)]'>
            <Text className='m-0 text-[24px] font-black leading-1 tracking-[-0.03em] text-[#20123e]'>
              Order Summary
            </Text>
            <Text className='mx-auto mt-4 max-w-[440.01px] text-[15px] leading-[1.7] text-[#5a5a5a]'>
              You can review the order details below and return to your account
              whenever you&apos;re ready.
            </Text>

            <Section className='mt-7 rounded-[16.01px] bg-[#f4f1fb] px-6 py-5 text-left'>
              <Text className='m-0 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#7b70a0]'>
                Current status
              </Text>
              <Text className='m-0 mt-2 text-[22px] font-black text-[#26184a]'>
                Payment pending
              </Text>
            </Section>

            <Section className='mt-4 rounded-[16.01px] bg-[#f4f1fb] px-6 py-5 text-left'>
              <Text className='m-0 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#7b70a0]'>
                Order details
              </Text>
              <Text className='m-0 mt-2 whitespace-pre-wrap text-[17px] leading-[1.65] text-[#26184a]'>
                {summary}
              </Text>
            </Section>

            <Section className='mt-7 text-center'>
              <Button
                href={dashboardUrl}
                className='inline-block rounded-full px-8 py-3 text-[16px] font-extrabold text-white no-underline'
                style={{
                  background:
                    'linear-gradient(90deg, #4e15e9 0%, #6f2cff 50%, #8755ff 100%)',
                }}>
                View Order
              </Button>
            </Section>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
