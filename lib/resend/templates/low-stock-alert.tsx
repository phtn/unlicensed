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
import {FooterEmailContent} from './footer'

export type LowStockAlertEmailProps = {
  recipientName: string
  productName: string
  currentStockLabel: string
  thresholdLabel: string
  adminProductUrl?: string
}

export const LowStockAlertEmail = ({
  recipientName,
  productName,
  currentStockLabel,
  thresholdLabel,
  adminProductUrl,
}: LowStockAlertEmailProps) => (
  <Html>
    <Preview>{`${productName} is low on stock`}</Preview>
    <Tailwind>
      <Head />
      <Body className='bg-[#f6f8fc] py-8 font-sans text-[#0f172a]'>
        <Container className='mx-auto max-w-140 rounded-2xl bg-white px-8 py-10 shadow-[0_8px_40px_rgba(15,23,42,0.08)]'>
          <Section className='mb-8 rounded-xl bg-linear-to-r from-amber-500 to-rose-500 px-6 py-6 text-white'>
            <Text className='m-0 text-[14px] uppercase tracking-[0.12em] opacity-85'>
              Inventory Alert
            </Text>
            <Text className='m-0 mt-2 text-[30px] leading-9 font-semibold'>
              {productName} is low on stock
            </Text>
            <Text className='m-0 mt-3 text-[15px] leading-5.5 opacity-90'>
              Hi {recipientName},
            </Text>
          </Section>

          <Section className='rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-5 py-4'>
            <Text className='m-0 text-[13px] uppercase tracking-[0.12em] text-[#64748b]'>
              Current stock
            </Text>
            <Text className='m-0 mt-2 text-[26px] font-semibold text-[#0f172a]'>
              {currentStockLabel}
            </Text>
          </Section>

          <Section className='mt-4 rounded-xl border border-[#e2e8f0] bg-white px-5 py-4'>
            <Text className='m-0 text-[13px] uppercase tracking-[0.12em] text-[#64748b]'>
              Alert threshold
            </Text>
            <Text className='m-0 mt-2 text-[20px] font-semibold text-[#0f172a]'>
              {thresholdLabel}
            </Text>
          </Section>

          <Text className='m-0 mt-6 text-[14px] leading-6 text-[#334155]'>
            This alert was triggered because the product is at or below its
            configured inventory threshold.
          </Text>

          {adminProductUrl ? (
            <Section className='mt-7 text-center'>
              <Button
                href={adminProductUrl}
                className='inline-block rounded-full bg-[#0f172a] px-6 py-3 text-[14px] font-semibold text-white no-underline'
              >
                Review Product Inventory
              </Button>
            </Section>
          ) : null}

          <Hr className='my-7 border-[#e2e8f0]' />

          <FooterEmailContent baseUrl='https://rapidfirenow.com' />
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
