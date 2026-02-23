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

export type NotificationEmailProps = {
  userName: string
  title: string
  message: string
  ctaLabel?: string
  ctaUrl?: string
}

export const NotificationEmail = ({
  userName,
  title,
  message,
  ctaLabel,
  ctaUrl,
}: NotificationEmailProps) => (
  <Html>
    <Preview>{title}</Preview>
    <Tailwind>
      <Head />
      <Body className='bg-[#f6f8fc] py-8 font-sans text-[#0f172a]'>
        <Container className='mx-auto max-w-140 rounded-2xl bg-white px-8 py-10 shadow-[0_8px_40px_rgba(15,23,42,0.08)]'>
          <Section className='mb-8 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-6 py-6 text-white'>
            <Text className='m-0 text-[14px] uppercase tracking-[0.12em] opacity-85'>
              Notification
            </Text>
            <Text className='m-0 mt-2 text-[30px] leading-9 font-semibold'>
              {title}
            </Text>
            <Text className='m-0 mt-3 text-[15px] leading-5.5 opacity-90'>
              Hi {userName},
            </Text>
          </Section>

          <Section className='rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-5 py-4'>
            <Text className='m-0 text-[14px] leading-5.5 text-[#334155] whitespace-pre-wrap'>
              {message}
            </Text>
          </Section>

          {ctaLabel && ctaUrl ? (
            <Section className='text-center mt-7'>
              <Button
                href={ctaUrl}
                className='inline-block rounded-full bg-[#0f172a] px-6 py-3 text-[14px] font-semibold text-white no-underline'>
                {ctaLabel}
              </Button>
            </Section>
          ) : null}

          <Hr className='my-7 border-[#e2e8f0]' />

          <FooterEmailContent baseUrl={'https://rapidfirenow.com'} />
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
