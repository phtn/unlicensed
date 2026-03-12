import {
  Column,
  Hr,
  Img,
  Link,
  Row,
  Section,
  Text,
} from '@react-email/components'

export type Item = {
  id: string
  name: string
  price: string
  quantity: string
  description: string
  total: string
  image: string
}

interface LineItemsProps {
  items: Item[]
  total: string
}
export const LineItems = ({items, total}: LineItemsProps) => {
  return (
    <Section>
      <Section className='border-collapse border-spacing-0 text-[rgb(51,51,51)] bg-[rgb(250,250,250)] rounded-[3px] text-[12px] mt-[30.01px] mb-[15.01px] min-h-[24.01px] flex items-center'>
        <Row>
          <Column className='w-10'>
            <Img
              src={`https://res.cloudinary.com/dx0heqhhe/image/upload/v1771881183/rf-logo-round-latest_n1ylmo.png`}
              width='auto'
              height='28'
              alt='RF Logo'
              className='aspect-auto'
            />
          </Column>
          <Column>
            <Text className='bg-[#fafafa] pl-[10.01px] font-clash font-semibold text-sm leading-[24.01px] m-0'>
              Shop
            </Text>
          </Column>
        </Row>
      </Section>
      {items.map((item) => (
        <LineItem key={item.id} item={item} />
      ))}
      <Hr className='mt-[10.01px] mb-0' />
      <Section align='right'>
        <Row>
          <Column className='table-cell' align='right'>
            <Text className='m-0 font-okxs font-medium text-[rgb(102,102,102)] text-[10px] p-0 pr-[30.01px] text-right'>
              TOTAL
            </Text>
          </Column>
          <Column className='min-h-12 pt-12 [border-left:1px_solid_rgb(238,238,238)]' />
          <Column className='table-cell w-[90.01px]'>
            <Text className='text-base font-okxs font-medium whitespace-nowrap m-0 mr-9 text-right'>
              {total}
            </Text>
          </Column>
        </Row>
      </Section>
      <Hr className='mb-[75.01px]' />
    </Section>
  )
}

const LineItem = ({item}: {item: Item}) => {
  return (
    <Section>
      <Section>
        <Row className='px-4'>
          <Column className='w-16'>
            <Img
              src={`${item.image ?? '/static/slurry.webp'}`}
              width='64'
              height='64'
              alt='RF'
              className='ml-5 rounded-[14.01px] border border-solid border-[rgb(242,242,242)]'
            />
          </Column>
          <Column className='pl-[22.01px] font-okxs'>
            <Text className='text-sm font-okxs font-semibold m-0 p-0 leading-[1.4]'>
              {item.name}
            </Text>
            <Text className='text-xs text-[rgb(102,102,102)] m-0 p-0 leading-[1.4]'>
              {item.description}
            </Text>
            <Text className='text-xs text-[rgb(102,102,102)] m-0 p-0 leading-[1.4]'>
              {item.quantity}
            </Text>
            <Link
              href='https://www.rapidfirenow.com/'
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
            className='table-cell pr-5 w-[100.01px] align-top'
            align='right'>
            <Text className='text-[12px] font-space leading-[24.01px] font-medium m-0'>
              {item.total}
            </Text>
          </Column>
        </Row>
      </Section>
    </Section>
  )
}
