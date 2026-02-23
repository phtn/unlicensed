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

export type WelcomeEmailProps = {
  userName: string
  loginUrl?: string
  supportUrl?: string
}

export const WelcomeEmail = ({
  userName,
  loginUrl = '#',
  supportUrl,
}: WelcomeEmailProps) => (
  <Html>
    <Preview>Welcome to Rapid Fire — Where fast minds thrive.</Preview>
    <Tailwind>
      <Head />
      <Body className='bg-[#f6f8fc] py-8 font-sans text-[#0f172a]'>
        <Container className='mx-auto max-w-140 rounded-2xl bg-white px-8 py-10 shadow-[0_8px_40px_rgba(15,23,42,0.08)]'>
          <Section className='mb-8 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-6 py-6 text-white'>
            <Text className='m-0 text-[14px] uppercase tracking-[0.12em] opacity-85'>
              Welcome
            </Text>
            <Text className='m-0 mt-2 text-[30px] leading-9 font-semibold'>
              Hi {userName},
            </Text>
            <Text className='m-0 mt-3 text-[15px] leading-5.5 opacity-90'>
              Your account is ready. You&apos;re now part of Rapid Fire — where
              fast minds thrive.
            </Text>
          </Section>

          <Section className='rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-5 py-4'>
            <Text className='m-0 text-[14px] leading-5.5 text-[#334155]'>
              Get started by signing in and exploring your dashboard. If you
              have any questions, we&apos;re here to help.
            </Text>
          </Section>

          <Section className='text-center mt-7'>
            <Button
              href={loginUrl}
              className='inline-block rounded-full bg-[#0f172a] px-6 py-3 text-[14px] font-semibold text-white no-underline'>
              Sign in to your account
            </Button>
          </Section>

          {supportUrl ? (
            <Text className='mb-0 mt-6 text-[14px] leading-5.5 text-[#334155]'>
              Need help?{' '}
              <a href={supportUrl} className='text-[#0ea5e9] underline'>
                Contact support
              </a>
            </Text>
          ) : null}

          <Hr className='my-7 border-[#e2e8f0]' />

          <Text className='m-0 text-[12px] leading-4.5 text-[#64748b]'>
            Rapid Fire · Where fast minds Thrive.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
