import {
  Body,
  Column,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import tailwindConfig from '../../../tailwind.config'
import {FooterEmailContent} from './footer'
import {Item, LineItems} from './line-items'
import {RewardsGuide} from './rewards-guide'

const baseUrl =
  process.env.NODE_ENV === 'development'
    ? `http://localhost:3000`
    : 'https://rapidfirenow.com'

export type ReceiptEmailProps = {
  customerName: string
  customerEmail: string
  orderNumber: string
  invoiceDate: string
  total: string
  shippingAddress: string
  billingAddress: string
  lineItems: Array<Item>
}
export const ReceiptEmail = ({
  customerName,
  customerEmail,
  invoiceDate,
  orderNumber,
  total,
  shippingAddress,
  billingAddress,
  lineItems,
}: ReceiptEmailProps) => (
  <Html>
    <Head />
    <Tailwind config={tailwindConfig}>
      <Body className='font-okxs bg-white'>
        <Preview>Rapid Fire Receipt</Preview>
        <Container className='mx-auto px-0 py-5 pb-12 w-[660px] max-w-full'>
          <Section>
            <Row>
              <Column>
                <Img
                  src={`${baseUrl}/static/rf-wordmark-latest.png`}
                  width='auto'
                  height='42'
                  alt='RF Logo'
                  className='aspect-auto'
                />
              </Column>

              <Column align='right' className='table-cell'>
                <Text className='text-[28px] font-okxs font-thin text-[#888888] my-4 leading-6'>
                  Receipt
                </Text>
              </Column>
            </Row>
          </Section>

          <Section className='border-collapse border-spacing-0 font-okxs text-[rgb(51,51,51)] bg-[rgb(250,250,250)] rounded-[3px] text-[12px] mt-12'>
            <Row className='min-h-[54px]'>
              <Column colSpan={2}>
                <Section>
                  <Row>
                    <Column className='p-3 border-solid border-white border-0 border-r border-b min-h-[44px]'>
                      <Text className='m-0 p-0 text-[rgb(102,102,102)] text-[10px] leading-[1.4]'>
                        ACCOUNT
                      </Text>
                      <Link className='m-0 p-0 text-[#15c] text-[12px] leading-[1.4]'>
                        {customerEmail}
                      </Link>
                    </Column>
                  </Row>

                  <Row>
                    <Column className='p-3 border-solid border-white border-0 border-r border-b min-h-[44px]'>
                      <Text className='m-0 p-0 text-[rgb(102,102,102)] text-[10px] leading-[1.4]'>
                        INVOICE DATE
                      </Text>
                      <Text className='m-0 p-0 text-[12px] leading-[1.4]'>
                        {invoiceDate}
                      </Text>
                    </Column>
                  </Row>

                  <Row className=''>
                    <Column className='p-3 border-solid border-white border-0 border-r border-b min-h-[44px]'>
                      <Text className='m-0 p-0 text-[rgb(102,102,102)] text-[10px] leading-[1.4]'>
                        ORDER ID
                      </Text>
                      <Link className='m-0 p-0 text-[#15c] underline text-[12px] leading-[1.4]'>
                        {orderNumber}
                      </Link>
                    </Column>
                  </Row>
                </Section>
              </Column>
              <Column
                className='p-3 border-solid border-white border-0 border-r border-b min-h-[44px]'
                colSpan={2}>
                <Text className='m-0 p-0 text-[rgb(102,102,102)] text-[10px] leading-[1.4]'>
                  BILLED TO
                </Text>
                <Text className='m-0 p-0 text-[12px] leading-[1.4]'>
                  Visa .... 7461 (Apple Pay)
                </Text>
                <Text className='mt-4 p-0 text-[12px] leading-[1.4]'>
                  {customerName}
                </Text>
                <Text className='m-0 p-0 text-[12px] leading-[1.4]'>
                  2125 Chestnut St
                </Text>
                <Text className='m-0 p-0 text-[12px] leading-[1.4]'>
                  San Francisco, CA 94123
                </Text>
                <Text className='m-0 p-0 text-[12px] leading-[1.4]'>USA</Text>
              </Column>
            </Row>
          </Section>

          <LineItems baseUrl={baseUrl} items={lineItems} total={total} />
          {/*<Section className='border-collapse border-spacing-0 text-[rgb(51,51,51)] bg-[rgb(250,250,250)] rounded-[3px] text-[12px] mt-[30px] mb-[15px] min-h-[24px] flex items-center'>
            <Row>
              <Column className='w-10'>
                <Img
                  src={`${baseUrl}/static/rf-logo-round-latest.png`}
                  width='auto'
                  height='28'
                  alt='RF Logo'
                  className='aspect-auto'
                />
              </Column>
              <Column>
                <Text className='bg-[#fafafa] pl-[10px] font-polysans font-semibold text-sm leading-[24px] m-0'>
                  Shop
                </Text>
              </Column>
            </Row>
          </Section>*/}

          {/*<Section>
            <Row className='px-4'>
              <Column className='w-16'>
                <Img
                  src={`${baseUrl}/static/slurry.webp`}
                  width='64'
                  height='64'
                  alt='RF'
                  className='ml-5 rounded-[14px] border border-solid border-[rgb(242,242,242)]'
                />
              </Column>
              <Column className='pl-[22px] font-okxs'>
                <Text className='text-sm font-okxs font-semibold m-0 p-0 leading-[1.4]'>
                  Peach Tree
                </Text>
                <Text className='text-xs text-[rgb(102,102,102)] m-0 p-0 leading-[1.4]'>
                  (Flower)
                </Text>
                <Text className='text-xs text-[rgb(102,102,102)] m-0 p-0 leading-[1.4]'>
                  1 oz x 1
                </Text>
                <Link
                  href='https://www.apple.com/'
                  className='text-[10px] text-[rgb(0,112,201)] font-okxs no-underline'>
                  Write a Review
                </Link>
                <span className='mx-1 text-[8px] text-[rgb(51,51,51)] font-extralight'>
                  |
                </span>
                <Link
                  href='https://www.rapidfirenow.com/'
                  className='text-[10px] text-[rgb(0,112,201)] no-underline'>
                  Report a Problem
                </Link>
              </Column>

              <Column
                className='table-cell pr-5 w-[100px] align-top'
                align='right'>
                <Text className='text-[12px] font-okxs leading-[24px] font-medium m-0'>
                  $14.99
                </Text>
              </Column>
            </Row>
          </Section>*/}

          <RewardsGuide baseUrl={baseUrl} />
          <FooterEmailContent baseUrl={baseUrl} />
        </Container>
      </Body>
    </Tailwind>
  </Html>
)

export default ReceiptEmail
