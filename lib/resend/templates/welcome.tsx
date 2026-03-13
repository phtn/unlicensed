import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import {FooterEmailContent} from './footer'
import {RewardsGuide} from './rewards-guide'

export type WelcomeEmailProps = {
  userName: string
  loginUrl?: string
  couponCode?: string
}

const baseUrl =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://rapidfirenow.com'

export const WelcomeEmail = ({couponCode}: WelcomeEmailProps) => (
  <Html className='dark:bg-black'>
    <Preview>Welcome to Rapid Fire! Your $25 credit is waiting...</Preview>
    <Tailwind>
      <Head />
      <Body className='m-0 bg-white dark:bg-black py-8 font-sans text-[#171717]'>
        <Container className='mx-auto w-full max-w-[640.01px] md:px-4 dark:bg-black'>
          <Section className='pb-4 md:pb-8 pt-2 text-center'>
            <Text
              className='m-0 mt-14 text-center text-[36px] font-black leading-[1.12]  text-black dark:text-white _text-[#D04A9B]'
              style={{textShadow: '0 6px 24px rgba(136, 0, 92, 0.38)'}}>
              Welcome!
            </Text>
          </Section>

          <Section
            className='overflow-hidden rounded-[32.01px] px-4 md:px-8 py-10 text-center text-white'
            style={{
              background:
                'radial-gradient(circle at 50% 62%, rgba(209, 73, 155, 0.95) 0%, rgba(209, 73, 155, 0.82) 28%, rgba(209, 73, 155, 0.8) 58%, rgba(209, 73, 155, 1) 100%)',
            }}>
            <Img
              src='https://res.cloudinary.com/dx0heqhhe/image/upload/v1773404669/rf-dual_oaplux.png'
              alt='rf-dual'
              width='300'
              className='mx-auto'
            />

            <Text
              className='m-0 mt-14 text-center text-[36px] font-black leading-[1.12] tracking-[-0.04em] text-white'
              style={{textShadow: '0 6px 24px rgba(136, 0, 92, 0.38)'}}>
              Your $25 credit is waiting!
            </Text>

            <Text className='mx-auto mt-5 max-w-120 text-[16px] leading-[1.7] text-[#efe9ff]'>
              Enter the coupon code below to at checkout.
            </Text>
            <Section className='w-[280.01px] mt-4 rounded-2xl bg-[#efefef] px-12 py-5 text-left'>
              <Text className='m-0 text-sm font-medium uppercase tracking-[0.12em] text-[#3b3b3b]'>
                COUPON CODE
              </Text>
              <Text className='m-0 mt-2 text-[20px] font-bold text-[#26184a]'>
                {couponCode}
              </Text>
            </Section>

            <Section className='mx-auto w-[280.01px] mt-10 rounded-xs px-12 py-5 text-center bg-black'>
              <Link
                href={`${baseUrl}/lobby`}
                className='m-0 text-[18px] font-semibold leading-[1.45] text-white w-full'>
                Shop Now
              </Link>
            </Section>
          </Section>
          <Section className='mt-8'>
            <RewardsGuide baseUrl={baseUrl} />
            <FooterEmailContent baseUrl={baseUrl} />
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
