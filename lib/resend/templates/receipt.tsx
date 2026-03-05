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
  shippingAddress: _shippingAddress,
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
            <Row className='min-h-[54.1px]'>
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
                  CUSTOMER
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
          <RewardsGuide baseUrl={baseUrl} />
          <FooterEmailContent baseUrl={baseUrl} />
        </Container>
      </Body>
    </Tailwind>
  </Html>
)

export default ReceiptEmail
