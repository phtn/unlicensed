import {SectionHeader} from '@/components/ui/section-header'
import {Sqrcon} from '@/components/ui/sqrcon'
import {Icon} from '@/lib/icons'
import {Button, Card, CardBody, CardFooter} from '@heroui/react'
import Link from 'next/link'
import {ViewTransition} from 'react'

interface PayCardProps {
  title: string
  description?: string
  href?: string
}

export const PayCard = ({title, description, href}: PayCardProps) => {
  return (
    <Card
      shadow='none'
      className='p-0 hover:bg-neutral-50 dark:hover:bg-dark-table/30 dark:bg-dark-table/40 transition-colors cursor-pointer min-h-32 border border-foreground/30'>
      <CardBody className='p-4 flex flex-col items-start space-y-3'>
        <div className='flex items-center space-x-3'>
          <Sqrcon id='paygate-count'>
            <span className='text-lg font-polysans text-background'>2</span>
          </Sqrcon>
          <SectionHeader title={title} description={description} />
        </div>
      </CardBody>
      <CardFooter className='relative px-0 bg-sidebar/30 border-sidebar border-t-2'>
        <div className="absolute w-500 scale-x-50 top-0 -left-150 inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 scale-100 pointer-events-none" />
        <ViewTransition>
          <div className='px-4 flex items-center justify-between w-full text-sm text-foreground/80 mt-auto'>
            <div className='flex items-center space-x-4 font-brk'>
              <span className='text-terpenes'>⬤</span>
              <span className='text-muted-foreground'>OK</span>
            </div>

            <Button
              size='sm'
              isIconOnly
              as={Link}
              variant='light'
              href={href ?? '#'}
              className='grow-0 aspect-square overflow-hidden'>
              <Icon name='chevron-double-left' className='rotate-90 size-6' />
            </Button>
          </div>
        </ViewTransition>
      </CardFooter>
    </Card>
  )
}
