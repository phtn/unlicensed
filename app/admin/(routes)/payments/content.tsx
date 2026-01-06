'use client'

import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {SectionHeader} from '@/app/admin/_components/ui/section-header'
import {Sqrcon} from '@/components/ui/sqrcon'
import {Icon, IconName} from '@/lib/icons'
import {Button, Card, CardBody, CardFooter} from '@heroui/react'
import Link from 'next/link'
import {ViewTransition} from 'react'

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
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {providers.map((provider) => (
            <Card
              key={provider.id}
              className='p-0 hover:bg-neutral-50 dark:hover:bg-dark-table/30 dark:bg-dark-table/40 transition-colors cursor-pointer min-h-32'>
              <CardBody className='p-4 flex flex-col items-start space-y-3'>
                <div className='flex items-center space-x-3'>
                  <Sqrcon id='paygate-count'>
                    <span className='text-lg font-polysans text-background'>
                      2
                    </span>
                  </Sqrcon>
                  <SectionHeader
                    title={provider.name}
                    description={provider.description}
                  />
                </div>
              </CardBody>
              <CardFooter className='px-0 bg-sidebar/40 border-t-2 border-sidebar'>
                <ViewTransition>
                  <div className='px-4 flex items-center justify-between w-full text-sm text-foreground/80 mt-auto'>
                    <div className='flex items-center space-x-4 font-brk'>
                      <span className='text-terpenes'>⬤</span>
                      <span className='text-muted-foreground'>good</span>
                    </div>

                    <Button
                      size='sm'
                      isIconOnly
                      as={Link}
                      variant='light'
                      href={provider.href}
                      className='grow-0 aspect-square overflow-hidden'>
                      <Icon
                        name='chevron-double-left'
                        className='rotate-90 size-6'
                      />
                    </Button>
                  </div>
                </ViewTransition>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </MainWrapper>
  )
}
