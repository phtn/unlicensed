import {ClassName} from '@/app/types'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Card, CardBody} from '@heroui/react'
import Link from 'next/link'
import {PropsWithChildren, ReactNode} from 'react'
import {HyperList} from './hyper-list'
import ShimmerText from './shimmer'

interface ArcCardProps {
  children?: ReactNode
  className?: string
  actionbar?: ReactNode
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  radius?: 'none' | 'sm' | 'md' | 'lg'
}

const ArcCard = ({
  children,
  className,
  shadow = 'none',
  radius = 'none',
}: ArcCardProps) => {
  return (
    <div className='max-w-2xl mx-auto'>
      <Card
        shadow={shadow}
        radius={radius}
        className={cn(
          'border border-foreground/20 dark:bg-dark-table/40',
          className,
        )}>
        <CardBody className='p-4 sm:p-8 space-y-6'>{children}</CardBody>
      </Card>
    </div>
  )
}

interface ArcHeaderProps {
  title: string
  description?: string
  icon?: IconName
  iconStyle?: ClassName
  status?: ReactNode
}

const ArcHeader = ({
  title,
  description,
  icon,
  iconStyle,
  status,
}: ArcHeaderProps) => (
  <div>
    <div className='flex items-center justify-between w-full'>
      <h1 className='flex items-center text-xl md:text-2xl font-polysans tracking-tight opacity-90 h-12'>
        {title}
      </h1>
      <div className='flex items-center'>{status}</div>
    </div>
    <div className='flex items-center md:space-x-1 font-space'>
      {icon && (
        <Icon name={icon} className={cn('size-6 text-indigo-400', iconStyle)} />
      )}
      <span className='opacity-60'>{description}</span>
    </div>
  </div>
)

interface ArcCalloutProps {
  value?: ReactNode
  icon?: IconName
}

const ArcCallout = ({value, icon}: ArcCalloutProps) => (
  <div className='flex items-start md:items-center space-x-2 p-1.5 bg-sidebar/40 rounded-md'>
    {icon && (
      <Icon name={icon} className='size-4 opacity-70 mt-0.5 md:mt-0 ml-0.5' />
    )}
    <p className='text-sm text-color-muted'>{value}</p>
  </div>
)

const ArcActionBar = ({children}: PropsWithChildren) => (
  <div className='grid grid-cols-2 gap-0 w-full'>{children}</div>
)

interface ArcButtonProps {
  label: string
  fn?: VoidFunction
  href?: string
  icon?: IconName
}

const ArcButtonLeft = ({label, fn, href, icon}: ArcButtonProps) => (
  <Button
    as={Link}
    size='lg'
    href={href ?? '#'}
    radius='none'
    variant='flat'
    onPress={fn}
    startContent={icon && <Icon name={icon} className='size-5' />}
    className='w-full font-polysans font-normal! dark:bg-sidebar'>
    {label}
  </Button>
)

const ArcButtonRight = ({label, fn, href, icon}: ArcButtonProps) => (
  <Button
    as={Link}
    size='lg'
    href={href ?? '#'}
    radius='none'
    variant='solid'
    color='primary'
    onPress={fn}
    endContent={icon && <Icon name={icon} className='size-5' />}
    className='w-full font-polysans font-normal! bg-dark-gray dark:bg-white dark:text-dark-gray'>
    {label}
  </Button>
)
const ArcButtonFull = ({label, fn, href, icon}: ArcButtonProps) => (
  <Button
    as={Link}
    size='lg'
    onPress={fn}
    radius='none'
    variant='flat'
    href={href ?? '#'}
    endContent={icon && <Icon name={icon} className='size-5' />}
    className='w-full col-span-2 font-polysans font-normal! bg-sidebar dark:bg-dark-table/40'>
    {label}
  </Button>
)

interface ArcLineItemsProps<T> {
  data: T & {label: string; value: string}[]
}

const ArcLineItems = <T,>({data}: ArcLineItemsProps<T>) => (
  <HyperList
    data={data}
    component={ArcLineItem}
    container=' bg-sidebar/50 rounded-md p-4 space-y-0.5 mb-8'
    itemStyle=' border-b border-dotted border-light-gray/40 dark:border-light-gray/20 last:border-0 py-2.5'
  />
)

const ArcLineItem = <T extends {label: string; value: string}>(item: T) => (
  <div className='flex items-center justify-between text-sm'>
    <span className='font-brk opacity-80'>{item.label}</span>
    <span className='font-brk capitalize'>{item.value}</span>
  </div>
)

interface ArcLoaderProps {
  text?: string
  loading?: boolean
  children?: ReactNode
}

const ArcLoader = ({text, loading, children}: ArcLoaderProps) => (
  <div className='relative flex items-center font-polysans w-full'>
    <div className='bg-zinc-900 dark:bg-transparent h-12 w-full flex flex-1 items-center justify-center px-3'>
      <ShimmerText
        surface='auto'
        variant='default'
        className='text-xs lg:text-2xl flex leading-6 md:leading-6 items-center p-0 m-0 text-center font-semibold font-figtree'>
        {text} {children}
      </ShimmerText>
      <Icon
        name='spinners-ring'
        className={cn(
          'size-3 text-orange-200 ml-1',
          !loading && 'text-featured',
        )}
      />
    </div>
  </div>
)

export {
  ArcActionBar,
  ArcButtonFull,
  ArcButtonLeft,
  ArcButtonRight,
  ArcCallout,
  ArcCard,
  ArcHeader,
  ArcLineItems,
  ArcLoader,
}
