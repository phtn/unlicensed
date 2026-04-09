import {SectionHeader} from '@/components/ui/section-header'
import {Sqrcon} from '@/components/ui/sqrcon'
import {GatewayWallet} from '@/convex/gateways/d'
import {Icon} from '@/lib/icons'
import {Card, Radio} from '@heroui/react'
import Link from 'next/link'
import {ViewTransition} from 'react'

interface PayCardProps {
  radioValue?: string
  title?: string
  description?: string
  href?: string
  accounts?: Array<GatewayWallet>
  isDefault?: boolean
}

export const PayCard = ({
  radioValue,
  isDefault,
  title,
  description,
  href,
  accounts,
}: PayCardProps) => {
  return (
    <Card className='relative p-0 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-table/30 dark:bg-dark-table/40 transition-colors cursor-pointer min-h-32 border border-foreground/30'>
      <Card.Content className='p-4 flex flex-col items-start space-y-3'>
        <div className='flex w-full items-start gap-3'>
          <div className='flex min-w-0 items-center space-x-3 pe-10'>
            <Sqrcon id='gateway-accounts'>
              <span className='text-lg font-polysans text-background'>
                {accounts?.length ?? 0}
              </span>
            </Sqrcon>
            <SectionHeader title={title} description={description} />
          </div>
          {radioValue != null && (
            <Radio
              value={radioValue}
              aria-label={`Set ${title ?? 'gateway'} as default`}
              className='absolute top-2 right-2 z-10'>
              <Radio.Control className='flex size-5 items-center justify-center rounded-full border border-foreground/30 bg-background/80 shadow-sm backdrop-blur-sm'>
                <Radio.Indicator className='flex size-full items-center justify-center rounded-full bg-indigo-500 text-white'>
                  {({isSelected}) =>
                    isSelected ? <Icon name='check' className='size-3' /> : null
                  }
                </Radio.Indicator>
              </Radio.Control>
            </Radio>
          )}
        </div>
      </Card.Content>
      <Card.Footer className='flex items-center h-10 relative px-0 bg-sidebar/30 border-sidebar border-t-2'>
        <div className="absolute w-500 scale-x-50 top-0 -left-150 inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 scale-100 pointer-events-none" />
        <ViewTransition>
          <div className='px-4 flex items-center justify-between w-full text-sm text-foreground/80'>
            <div className='flex items-center space-x-3'>
              <div className='flex items-center space-x-1 font-brk'>
                <span className='text-terpenes mb-0.5 text-xs'>⬤</span>
                <span className='text-base text-muted-foreground'>OK</span>
              </div>
              {isDefault && (
                <div className='flex items-center space-x-0.5 rounded-sm font-brk bg-mac-blue px-1.5'>
                  {/*<span className='text-primary mb-0.5 text-xs'>⬤</span>*/}
                  <span className='text-sm text-white uppercase'>Default</span>
                </div>
              )}
            </div>
            <Link
              href={href ?? '#'}
              className='font-okxs opacity-40 hover:opacity-100 grow-0 overflow-hidden pe-1 inline-flex items-center gap-1 text-sm'>
              <span>Configure</span>
              <Icon name='chevron-right' className='size-4' />
            </Link>
          </div>
        </ViewTransition>
      </Card.Footer>
    </Card>
  )
}
