import {
  Body,
  Button,
  Column,
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
import {FooterEmailContent} from './footer'
import {RewardsGuide} from './rewards-guide'

export type InvitationEmailProps = {
  recipientName: string
  inviterName?: string
  title: string
  message: string
  ctaLabel: string
  ctaUrl: string
  accessCode?: string
}

const baseUrl =
  process.env.NODE_ENV === 'development'
    ? `http://localhost:3000`
    : 'https://rapidfirenow.com'

export const InvitationEmail = ({
  recipientName,
  inviterName,
  title,
  message,
  ctaLabel,
  ctaUrl,
  accessCode,
}: InvitationEmailProps) => (
  <Html>
    <Preview>{title}</Preview>
    <Tailwind>
      <Head />
      <Body className='bg-[#f6f8fc] py-8 font-sans text-[#0f172a]'>
        <Container className='mx-auto max-w-140 rounded-2xl bg-white px-8 py-10 shadow-[0_8px_40px_rgba(15,23,42,0.08)]'>
          <Section>
            <Column>
              <Img
                src={
                  'https://res.cloudinary.com/dx0heqhhe/image/upload/v1771881178/rf-wordmark-flex_vrgct3.png'
                }
                width='auto'
                height='42'
                alt='RF Wordmark'
                className='aspect-auto'
              />
            </Column>
          </Section>
          <Section className='mb-8 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-6 py-6'>
            <Text className='m-0 text-[12px] uppercase tracking-[0.12em] opacity-65'>
              vip only
            </Text>
            <Text className='m-0 mt-2 text-[28px] leading-9 font-polysans font-semibold'>
              {title}
            </Text>
            <Text className='m-0 mt-3 text-[12px] font-okxs leading-5.5 opacity-90'>
              Hi {recipientName},
              {inviterName
                ? ` ${inviterName}'re excited to invite you to the official launch of Rapid Fire, our brand new online store!
              We’re proud to finally open our virtual doors and share our collection with you.`
                : ''}
            </Text>
          </Section>

          <Section className='rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-5 py-4'>
            <Text className='m-0 text-[14px] leading-5.5 text-[#334155] whitespace-pre-wrap'>
              {message}
            </Text>
            {accessCode ? (
              <Text className='m-0 mt-3 text-[13px] leading-5 text-[#64748b]'>
                Access Code: {accessCode}
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
          <RewardsGuide baseUrl={baseUrl} />
          <FooterEmailContent baseUrl={baseUrl} />
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
