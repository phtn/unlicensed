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

export type BulkValueBenefit = {
  title: string
  description: string
}

export type BulkValueEmailProps = {
  notice: string
  noticeCtaLabel: string
  noticeCtaUrl: string
  headline: string
  subheadline: string
  ctaLabel: string
  ctaUrl: string
  introTitle: string
  introBody: string
  reasonsHeadline: string
  reasonsSubheadline: string
  secondaryCtaLabel: string
  secondaryCtaUrl: string
  heroImageUrls?: string[]
  benefits?: BulkValueBenefit[]
}

const DEFAULT_HERO_IMAGE_URLS = [
  `${baseUrl}/static/slurry.webp`,
  `${baseUrl}/static/devilsm.webp`,
  `${baseUrl}/static/slurry.webp`,
]

const DEFAULT_BENEFITS: BulkValueBenefit[] = [
  {
    title: 'LOWER COST',
    description: 'Better value per gram means more fire for the same spend.',
  },
  {
    title: 'FEWER RE-UPS',
    description: 'Stock up once and spend less time rebuilding the same cart.',
  },
  {
    title: 'SAME FIRE',
    description: 'The menu you already trust, just packed into a smarter buy.',
  },
]

export const BulkValueEmail = ({
  notice,
  noticeCtaLabel,
  noticeCtaUrl,
  headline,
  subheadline,
  ctaLabel,
  ctaUrl,
  introTitle,
  introBody,
  reasonsHeadline,
  reasonsSubheadline,
  secondaryCtaLabel,
  secondaryCtaUrl,
  heroImageUrls = DEFAULT_HERO_IMAGE_URLS,
  benefits = DEFAULT_BENEFITS,
}: BulkValueEmailProps) => (
  <Html>
    <Preview>{headline.replace(/\n/g, ' ')}</Preview>
    <Tailwind>
      <Head />
      <Body className='m-0 bg-[#12060f] py-6 font-sans text-white'>
        <Container className='mx-auto w-full max-w-[520.01px] overflow-hidden bg-[#12060f]'>
          <Section className='px-6 py-1 text-center bg-[#d1499b]'>
            <Text className='m-0 text-[13px] font-normal tracking-[0.04em] text-white'>
              {notice}{' '}
              <a
                href={noticeCtaUrl}
                className='font-extrabold underline text-white'>
                {noticeCtaLabel}
              </a>
            </Text>
          </Section>

          <Section
            className='px-6 py-8 text-center'
            style={{
              background:
                'radial-gradient(circle at top, rgba(228, 58, 164, 0.28) 0%, rgba(18, 6, 15, 0) 42%), linear-gradient(180deg, #050205 0%, #12060f 100%)',
              borderLeft: '6px solid #d1499b',
              borderRight: '6px solid #d1499b',
              borderBottom: '6px solid #d1499b',
            }}>
            <Img
              src={`https://res.cloudinary.com/dx0heqhhe/image/upload/v1773388822/rf-sticker_vsksfb.png`}
              // src{`https://res.cloudinary.com/dx0heqhhe/image/upload/v1773327157/rf-wordmark-white_dznnii.png`}
              alt='Rapid Fire'
              width='140'
              className='mx-auto'
            />

            <Text
              className='m-0 mt-8 text-center text-[32px] font-black uppercase leading-[0.95] tracking-[-0.04em] text-white whitespace-pre-wrap'
              style={{textShadow: '0 3px 0 rgba(196, 39, 134, 0.45)'}}>
              {headline}
            </Text>

            <Text className='m-0 mt-5 text-[18px] font-semibold uppercase tracking-[0.12em] text-[#ffd7eb]'>
              {subheadline}
            </Text>

            <Section className='mt-7 text-center'>
              <Button
                href={ctaUrl}
                className='inline-block rounded-full px-8 py-3 bg-[#d1499b] text-[16px] font-extrabold text-white no-underline'>
                {ctaLabel}
              </Button>
            </Section>

            <Section className='mt-8 px-2'>
              <Row>
                {heroImageUrls.slice(0, 3).map((imageUrl, index) => (
                  <Column key={`${imageUrl}-${index}`} align='center'>
                    <Img
                      src={imageUrl}
                      alt='Featured flower'
                      width={index === 1 ? '160' : '140'}
                      className='mx-auto'
                    />
                  </Column>
                ))}
              </Row>
            </Section>
          </Section>

          <Section className='px-7 py-8 text-center bg-white'>
            <Text className='m-0 text-[24px] font-black uppercase leading-1 tracking-[-0.04em] text-[#231018]'>
              {introTitle}
            </Text>
            <Text className='mx-auto mt-4 max-w-[410.01px] text-[15px] leading-[1.65] text-[#4a2a34]'>
              {introBody}
            </Text>

            <Section className='mt-7 text-center'>
              <Button
                href={secondaryCtaUrl}
                className='inline-block rounded-full px-8 py-3 text-[16px] font-extrabold text-white bg-[#d1499b] no-underline'>
                {secondaryCtaLabel}
              </Button>
            </Section>

            <Text className='m-0 mt-9 text-[24px] font-black uppercase leading-[0.95] tracking-[-0.04em] text-[#231018]'>
              {reasonsHeadline}
            </Text>
            <Text className='mx-auto mt-4 max-w-[420.01px] text-[16px] leading-[1.65] text-[#5b3742]'>
              {reasonsSubheadline}
            </Text>

            <Section className='mt-7'>
              {benefits.map((benefit) => {
                return (
                  <Section
                    key={benefit.title}
                    className='mt-4 px-6 py-6 text-center bg-[#d1499b]'>
                    <Text className='m-0 text-[20px] font-semibold uppercase tracking-[-0.03em] text-white'>
                      {benefit.title}
                    </Text>
                    <Text className='mx-auto mt-3 max-w-[360.01px] text-[16px] leading-[1.6] text-white'>
                      {benefit.description}
                    </Text>
                  </Section>
                )
              })}
            </Section>

            <Text className='m-0 mt-8 text-[12px] uppercase tracking-[0.18em] text-[#7b5561]'>
              Rapid Fire
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
