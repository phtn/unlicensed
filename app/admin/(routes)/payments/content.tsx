'use client'

import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {IconName} from '@/lib/icons'
import {PayCard} from './card-item'

interface PaymentProvider {
  id: string
  name: string
  description: string
  icon: IconName
  href: string
  color: string
}

const providers: PaymentProvider[] = [
  {
    id: 'paygate',
    name: 'PayGate',
    description: 'Multi-chain payments',
    icon: 'wallet',
    href: '/admin/payments/paygate',
    color: 'indigo',
  },
  // Add more providers here as they are implemented
]

export const Content = () => {
  return (
    <MainWrapper className='border-t-0'>
      <div className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 md:px-0'>
          {providers.map((provider) => (
            <PayCard
              key={provider.id}
              title={provider.name}
              description={provider.description}
              href={provider.href}
            />
            // <Card
            //   shadow='none'
            //   key={provider.id}
            //   className='p-0 hover:bg-neutral-50 dark:hover:bg-dark-table/30 dark:bg-dark-table/40 transition-colors cursor-pointer min-h-32 border border-foreground/30'>
            //   <CardBody className='p-4 flex flex-col items-start space-y-3'>
            //     <div className='flex items-center space-x-3'>
            //       <Sqrcon id='paygate-count'>
            //         <span className='text-lg font-polysans text-background'>
            //           2
            //         </span>
            //       </Sqrcon>
            //       <SectionHeader
            //         title={provider.name}
            //         description={provider.description}
            //       />
            //     </div>
            //   </CardBody>
            //   <CardFooter className='relative px-0 bg-sidebar/30 border-sidebar border-t-2'>
            //     <div className="absolute w-500 scale-x-50 top-0 -left-150 inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 scale-100 pointer-events-none" />
            //     <ViewTransition>
            //       <div className='px-4 flex items-center justify-between w-full text-sm text-foreground/80 mt-auto'>
            //         <div className='flex items-center space-x-4 font-brk'>
            //           <span className='text-terpenes'>⬤</span>
            //           <span className='text-muted-foreground'>good</span>
            //         </div>

            //         <Button
            //           size='sm'
            //           isIconOnly
            //           as={Link}
            //           variant='light'
            //           href={provider.href}
            //           className='grow-0 aspect-square overflow-hidden'>
            //           <Icon
            //             name='chevron-double-left'
            //             className='rotate-90 size-6'
            //           />
            //         </Button>
            //       </div>
            //     </ViewTransition>
            //   </CardFooter>
            // </Card>
          ))}
        </div>
      </div>
    </MainWrapper>
  )
}
