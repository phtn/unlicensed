import {Column, Img, Link, Row, Section, Text} from '@react-email/components'
export const FooterEmailContent = ({baseUrl}: {baseUrl: string}) => {
  return (
    <Section>
      <Row>
        <Column
          align='center'
          className='block mt-10 rounded-full bg-white w-fit mx-auto'>
          <Img
            src={`https://res.cloudinary.com/dx0heqhhe/image/upload/v1771881183/rf-logo-round-latest_n1ylmo.png`}
            width='26'
            height='26'
            alt='RF Logo'
          />
        </Column>
      </Row>
      <Text className='m-0 mt-2 text-center text-[12px] leading-[24.01px] text-[rgb(102,102,102)] font-clash'>
        <Link href={`${baseUrl}/account`}>Account</Link> •{' '}
        <Link href={`${baseUrl}/lobby`}>Shop</Link> •{' '}
        <Link href={`${baseUrl}/purchase-agreement`}>Purchase Agreement</Link> •{' '}
        <Link href={`${baseUrl}/privacy-policy`}>Privacy</Link> •{' '}
        <Link href={`${baseUrl}/terms-of-use`}>Terms</Link>
      </Text>
      <Text className='m-0 mt-[26.01px] text-center text-[12px] leading-[24.01px] text-[rgb(102,102,102)] font-clash'>
        Copyright © {new Date().getFullYear()} Rapid Fire <br />{' '}
        <Link href={`${baseUrl}/terms-of-use`}>All rights reserved.</Link>
      </Text>
    </Section>
  )
}
