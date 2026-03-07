import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

const baseUrl =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://rapidfirenow.com'

export type FirstOrderShopLink = {
  label: string
  url: string
}

export type FirstOrderEmailProps = {
  eyebrow: string
  discountText: string
  discountLabel: string
  headline: string
  body: string
  ctaLabel: string
  ctaUrl: string
  discountCode: string
  codeNote: string
  benefits?: string[]
  shopLinks?: FirstOrderShopLink[]
  secondaryCtaLabel: string
  secondaryCtaUrl: string
}

const DEFAULT_BENEFITS = [
  'Cannabis Cup Winning Growers',
  'California Quality',
  'Delivery Guaranteed',
  'Earn Cash Back',
  'Pay Your Way (Card • Apple Pay • Google Pay • Crypto • Cash App)',
]

const DEFAULT_SHOP_LINKS: FirstOrderShopLink[] = [
  {label: 'Flowers', url: 'https://rapidfirenow.com/lobby/category/flower'},
  {label: 'Vapes', url: 'https://rapidfirenow.com/lobby/category/vapes'},
  {label: 'Extracts', url: 'https://rapidfirenow.com/lobby/category/extracts'},
  {label: 'Edibles', url: 'https://rapidfirenow.com/lobby/category/edibles'},
  {
    label: 'Pre Rolls',
    url: 'https://rapidfirenow.com/lobby/category/pre-rolls',
  },
]

export const FirstOrderEmail = ({
  eyebrow,
  discountText,
  discountLabel,
  headline,
  body,
  ctaLabel,
  ctaUrl,
  discountCode,
  codeNote,
  benefits = DEFAULT_BENEFITS,
  shopLinks = DEFAULT_SHOP_LINKS,
  secondaryCtaLabel,
  secondaryCtaUrl,
}: FirstOrderEmailProps) => {
  const topRow = shopLinks.slice(0, 2)
  const middleRow = shopLinks.slice(2, 4)
  const bottomLink = shopLinks[4]

  return (
    <Html>
      <Preview>{discountText} on your first order from Rapid Fire</Preview>
      <Tailwind>
        <Head />
        <Body className='m-0 bg-black py-8 font-sans text-white'>
          <Container className='mx-auto w-full max-w-[520px] bg-black px-6 py-6'>
            <Section className='text-center'>
              <Img
                src={`${baseUrl}/static/rf-logo-round-latest.png`}
                alt='Rapid Fire'
                width='46'
                height='46'
                className='mx-auto'
              />
              <Text className='m-0 mt-5 text-center text-[12px] font-semibold tracking-[0.08em] uppercase text-[#d4d4d8]'>
                {eyebrow}
              </Text>
            </Section>

            <Section
              className='mx-auto mt-4 max-w-[300px] px-6 py-5 text-center'
              style={{
                background:
                  'linear-gradient(90deg, #a80d75 0%, #e43aa4 50%, #c61f8b 100%)',
                borderRadius: '20px 20px 80px 80px',
                boxShadow: '0 10px 28px rgba(228, 58, 164, 0.25)',
              }}>
              <Text className='m-0 font-clash text-[32px] leading-[1] font-extrabold tracking-[-0.04em] text-white'>
                {discountText}
              </Text>
              <Text className='m-0 mt-2 text-[14px] font-semibold tracking-[0.1em] uppercase text-white'>
                {discountLabel}
              </Text>
            </Section>

            <Section className='mt-10 text-center'>
              <Text className='m-0 text-[28px] leading-[1.2] font-semibold text-white'>
                {headline}
              </Text>
              <Text className='mx-auto mt-4 max-w-[390px] text-[15px] leading-[1.65] text-[#d4d4d8]'>
                {body}
              </Text>
            </Section>

            <Section
              className='mx-auto mt-8 rounded-[18px] px-4 py-4 text-center'
              style={{
                background: 'linear-gradient(90deg, #c51883 0%, #ef4eaf 100%)',
                boxShadow: '0 12px 24px rgba(197, 24, 131, 0.28)',
              }}>
              <Button
                href={ctaUrl}
                className='block w-full text-[18px] font-extrabold tracking-[-0.03em] text-white no-underline'>
                {ctaLabel}
              </Button>
            </Section>

            <Section className='mt-5 text-center'>
              <Text className='m-0 text-[14px] font-semibold text-[#f472b6]'>
                Use code {discountCode} at checkout
              </Text>
              <Text className='m-0 mt-1 text-[12px] leading-[1.6] text-[#d4d4d8]'>
                {codeNote}
              </Text>
            </Section>

            <Section className='mx-auto mt-8 max-w-[360px]'>
              {benefits.map((benefit) => (
                <Text
                  key={benefit}
                  className='m-0 mt-3 text-[15px] leading-[1.5] text-white'>
                  <span style={{color: '#ec4899', paddingRight: '10px'}}>
                    ★
                  </span>
                  {benefit}
                </Text>
              ))}
            </Section>

            <Section className='mt-10 text-center'>
              <Text className='m-0 text-[18px] font-semibold text-white'>
                Shop Now
              </Text>
            </Section>

            <Section className='mt-5'>
              <Row>
                {topRow.map((link) => (
                  <Column key={link.label} align='center'>
                    <Button
                      href={link.url}
                      className='inline-block min-w-[124px] rounded-full bg-[#c42786] px-5 py-2 text-[15px] font-semibold text-white no-underline'>
                      {link.label}
                    </Button>
                  </Column>
                ))}
              </Row>
            </Section>

            <Section className='mt-4'>
              <Row>
                {middleRow.map((link) => (
                  <Column key={link.label} align='center'>
                    <Button
                      href={link.url}
                      className='inline-block min-w-[124px] rounded-full bg-[#c42786] px-5 py-2 text-[15px] font-semibold text-white no-underline'>
                      {link.label}
                    </Button>
                  </Column>
                ))}
              </Row>
            </Section>

            {bottomLink ? (
              <Section className='mt-4 text-center'>
                <Button
                  href={bottomLink.url}
                  className='inline-block min-w-[124px] rounded-full bg-[#c42786] px-5 py-2 text-[15px] font-semibold text-white no-underline'>
                  {bottomLink.label}
                </Button>
              </Section>
            ) : null}

            <Section className='mt-10 text-center'>
              <Button
                href={secondaryCtaUrl}
                className='inline-block rounded-full border border-solid border-[#d4d4d8] px-6 py-2 text-[15px] font-semibold text-white no-underline'>
                {secondaryCtaLabel}
              </Button>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
