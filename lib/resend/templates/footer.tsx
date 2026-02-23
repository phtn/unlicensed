import {Column, Img, Link, Row, Section, Text} from '@react-email/components'
export const FooterEmailContent = ({baseUrl}: {baseUrl: string}) => {
  return (
    <Section>
      <Row>
        <Column align='center' className='block mt-10'>
          <Img
            src={`${baseUrl}/static/rf-logo-round-latest.png`}
            width='26'
            height='26'
            alt='RF Logo'
          />
        </Column>
      </Row>
      <Text className='m-0 mt-2 text-center text-[12px] leading-[24px] text-[rgb(102,102,102)]'>
        <Link href={`${baseUrl}/account`}>Account</Link> •{' '}
        <Link href={`${baseUrl}/lobby`}>Shop</Link> •{' '}
        <Link href={`${baseUrl}/purchase-agreement`}>Purchase Agreement</Link> •{' '}
        <Link href={`${baseUrl}/privacy-policy`}>Privacy Policy </Link>
      </Text>
      <Text className='m-0 mt-[26px] text-center text-[12px] leading-[24px] text-[rgb(102,102,102)]'>
        Copyright © {new Date().getFullYear()} Rapid Fire <br />{' '}
        <Link href={`${baseUrl}/terms-of-use`}>All rights reserved.</Link>
      </Text>
    </Section>
  )
}
