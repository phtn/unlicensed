import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

export type ProductDiscountEmailProps = {
  recipientName: string
  productName: string
  productImageUrl?: string
  discountDescription: string
  discountCode?: string
  discountPercent?: number
  validUntil?: string
  ctaLabel: string
  ctaUrl: string
}

export const ProductDiscountEmail = ({
  recipientName,
  productName,
  productImageUrl,
  discountDescription,
  discountCode,
  discountPercent,
  validUntil,
  ctaLabel,
  ctaUrl,
}: ProductDiscountEmailProps) => (
  <Html>
    <Preview>Your discount for {productName}</Preview>
    <Tailwind>
      <Head />
      <Body className='bg-[#f6f8fc] py-8 font-sans text-[#0f172a]'>
        <Container className='mx-auto max-w-140 rounded-2xl bg-white px-8 py-10 shadow-[0_8px_40px_rgba(15,23,42,0.08)]'>
          <Section className='mb-8 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-6 py-6 text-white'>
            <Text className='m-0 text-[14px] uppercase tracking-[0.12em] opacity-85'>
              Product discount
            </Text>
            <Text className='m-0 mt-2 text-[30px] leading-9 font-semibold'>
              {discountPercent != null
                ? `${discountPercent}% off ${productName}`
                : `Your discount: ${productName}`}
            </Text>
            <Text className='m-0 mt-3 text-[15px] leading-5.5 opacity-90'>
              Hi {recipientName}, we&apos;ve got a deal just for you.
            </Text>
          </Section>

          {productImageUrl ? (
            <Section className='mb-6 rounded-xl overflow-hidden border border-[#e2e8f0]'>
              <Img
                src={productImageUrl}
                alt={productName}
                className='w-full max-w-full object-cover'
                width={560}
              />
            </Section>
          ) : null}

          <Section className='rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-5 py-4'>
            <Text className='m-0 text-[14px] leading-5.5 text-[#334155]'>
              {discountDescription}
            </Text>
            {discountCode ? (
              <Section className='mt-4 rounded-lg bg-[#0f172a] px-4 py-3 text-center'>
                <Text className='m-0 text-[12px] uppercase tracking-wider text-[#94a3b8]'>
                  Use code at checkout
                </Text>
                <Text className='m-0 mt-1 text-[20px] font-mono font-bold tracking-widest text-white'>
                  {discountCode}
                </Text>
              </Section>
            ) : null}
            {validUntil ? (
              <Text className='m-0 mt-3 text-[13px] leading-5 text-[#64748b]'>
                Valid until {validUntil}
              </Text>
            ) : null}
          </Section>

          <Section className='text-center mt-7'>
            <Button
              href={ctaUrl}
              className='inline-block rounded-full bg-[#0f172a] px-6 py-3 text-[14px] font-semibold text-white no-underline'>
              {ctaLabel}
            </Button>
          </Section>

          <Hr className='my-7 border-[#e2e8f0]' />

          <Text className='m-0 text-[12px] leading-4.5 text-[#64748b]'>
            Rapid Fire · Where fast minds Thrive.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
