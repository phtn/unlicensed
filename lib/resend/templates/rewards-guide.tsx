import {
  Column,
  Hr,
  Img,
  Link,
  Row,
  Section,
  Text,
} from '@react-email/components'

interface RewardsGuideProps {
  baseUrl: string
}
export const RewardsGuide = ({baseUrl}: RewardsGuideProps) => {
  const cashbackTiers = [
    {id: '1', subtotal: 'under $99.00', shipping: '$12.99', cashback: '1.5%'},
    {id: '2', subtotal: '$99 - $148.99', shipping: '$3.99', cashback: '2%'},
    {id: '3', subtotal: '$149 - $248.99', shipping: 'FREE', cashback: '3%'},
    {id: '4', subtotal: '$249 and above', shipping: 'FREE', cashback: '5%'},
  ]
  return (
    <Section>
      <Section>
        <Row className='flex items-center'>
          <Column>
            <Img
              src={
                'https://res.cloudinary.com/dx0heqhhe/image/upload/v1771881181/rf-logo-round-dark_gxg9er.png'
              }
              width='28'
              height='28'
              alt='Rewards'
            />
          </Column>

          <Column className='pl-[16.1px]'>
            <Text className='text-[20px] font-okxs font-medium whitespace-nowrap'>
              Loyalty Rewards
            </Text>
          </Column>
        </Row>
        <Row>
          <Column>
            <Text className='text-[10px] leading-[normal] text-[rgb(102,102,102)]'>
              Earn cash back and unlock free shipping every time you shop — no
              sign-ups, no punch cards. Your rewards are calculated
              automatically at checkout.
            </Text>
          </Column>
        </Row>
      </Section>

      <Text className='text-[12px] font-medium leading-[normal] text-[rgb(102,102,102)] m-0 mb-4'>
        1. First-Time Customer.
      </Text>
      <Text className='text-[10px] leading-[normal] text-[rgb(102,102,102)] m-0 mb-4'>
        New to the store? You get free shipping on your first order when your
        cart reaches $49 or more. It&apos;s our way of saying welcome.
      </Text>
      <Text className='text-[12px] font-medium leading-[normal] text-[rgb(102,102,102)] m-0 mb-4'>
        2. Cash Back Tiers.
      </Text>
      <Text className='text-[10px] leading-[normal] text-[rgb(102,102,102)] m-0 mb-4'>
        The more you add to your cart, the more you earn back — automatically
        issued as store credit after your order ships.
      </Text>

      <Hr className='mt-[30.01px] mb-0' />
      <Section align='right'>
        <Row className='w-full table-fixed'>
          <Column className='table-cell w-[72.01px] align-middle py-2'>
            <Text className='m-0 font-okxs font-medium text-[rgb(102,102,102)] text-[10px] p-0 pl-6'>
              Tier
            </Text>
          </Column>
          <Column className='w-[1.01px] min-h-[1.01px] align-middle p-0 [border-left:1px_solid_rgb(238,238,238)]' />
          <Column className='table-cell w-[160.01px] align-middle py-2 text-center'>
            <Text className='m-0 font-okxs font-medium text-[rgb(102,102,102)] text-[10px] p-0 text-center'>
              Cart Subtotal
            </Text>
          </Column>
          <Column className='w-[1.01px] min-h-[1.01px] align-middle p-0 [border-left:1px_solid_rgb(238,238,238)]' />
          <Column className='table-cell w-[90.01px] align-middle py-2 text-center'>
            <Text className='m-0 font-okxs font-medium text-[rgb(102,102,102)] text-[10px] p-0 text-center'>
              Shipping
            </Text>
          </Column>
          <Column className='w-[1.01px] min-h-[1.01px] align-middle p-0 [border-left:1px_solid_rgb(238,238,238)]' />
          <Column className='table-cell w-[90.01px] align-middle py-2 text-center'>
            <Text className='m-0 font-okxs font-medium text-[rgb(102,102,102)] text-[10px] p-0 text-center'>
              Cash Back
            </Text>
          </Column>
        </Row>
        <Hr className='mb-2' />
      </Section>
      <Section>
        {cashbackTiers.map((tier) => (
          <Row key={tier.id} className='w-full table-fixed'>
            <Column className='table-cell w-[72.01px] align-middle py-2'>
              <Text className='m-0 font-okxs font-medium text-[rgb(102,102,102)] text-[10px] p-0 pl-6'>
                {tier.id}
              </Text>
            </Column>
            <Column className='w-[1.01px] min-h-[1.01px] align-middle p-0 [border-left:1px_solid_rgb(238,238,238)]' />
            <Column className='table-cell w-[160.01px] align-middle py-2 text-center'>
              <Text className='m-0 font-okxs font-medium text-[rgb(102,102,102)] text-[10px] p-0 text-center'>
                {tier.subtotal}
              </Text>
            </Column>
            <Column className='w-[1.01px] min-h-[1.01px] align-middle p-0 [border-left:1px_solid_rgb(238,238,238)]' />
            <Column className='table-cell w-[90.01px] align-middle py-2 text-center'>
              <Text className='m-0 font-okxs font-medium text-[rgb(102,102,102)] text-[10px] p-0 text-center'>
                {tier.shipping}
              </Text>
            </Column>
            <Column className='w-[1.01px] min-h-[1.01px] align-middle p-0 [border-left:1px_solid_rgb(238,238,238)]' />
            <Column className='table-cell w-[90.01px] align-middle py-2 text-center'>
              <Text className='m-0 font-okxs font-medium text-[rgb(102,102,102)] text-[10px] p-0 text-center'>
                {tier.cashback}
              </Text>
            </Column>
          </Row>
        ))}
      </Section>
      <Hr className='mb-[75.01px]' />

      <Text className='text-xs text-[rgb(102,102,102)] my-5 leading-[normal] text-center'>
        {' '}
        You have the option to stop receiving email receipts. If you have opted
        out, you can still view your receipts in your account under Purchase
        History. To manage receipts or to opt in again, go to{' '}
        <Link href={`${baseUrl}/account`}>Account Settings.</Link>
      </Text>
    </Section>
  )
}
