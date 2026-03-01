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
      <Body className='bg-white py-[32px] font-sans text-[#0f172a]'>
        <Container className='mx-auto max-w-140 rounded-2xl bg-white px-[32px] py-[40px]'>
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
          <Section className='mb-[32px] rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-[24px] py-[28px]'>
            <Text className='my-3 text-[12px] uppercase tracking-[0.12em] opacity-65'>
              VIP only
            </Text>
            <Text className='m-0 mt-[4px] text-[24px] leading-9 font-polysans font-semibold'>
              {title}
            </Text>
            <Text className='m-0 mt-[6px] text-[12px] font-okxs leading-5.5 opacity-90'>
              <Text className='capitalize font-semibold'>
                Hi {recipientName}!
              </Text>
              {inviterName
                ? ` ${inviterName}'re excited to invite you to the official launch of Rapid Fire, our brand new online store!
              We’re proud to finally open our virtual doors and share our collection with you.`
                : ''}
            </Text>
          </Section>

          <Section className='flex items-center flex-center rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-[10px] py-[8px]'>
            <Text className='m-0 text-[14px] leading-5.5 text-[#334155] whitespace-pre-wrap'>
              {message}
            </Text>
            {accessCode ? (
              <Text className='m-0 mt-[6px] text-[13px] leading-5 text-[#64748b]'>
                Access Code: {accessCode}
              </Text>
            ) : null}
          </Section>

          <Section className='text-center mt-[14px]'>
            <Button
              href={ctaUrl}
              className='inline-block bg-[#0f172a] px-[12px] py-[6px] text-[14px] font-semibold text-white no-underline w-full'>
              {ctaLabel}
            </Button>
          </Section>

          <Hr className='my-[14px] border-[#e2e8f0]' />
          <RewardsGuide baseUrl={baseUrl} />
          <FooterEmailContent baseUrl={baseUrl} />
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
