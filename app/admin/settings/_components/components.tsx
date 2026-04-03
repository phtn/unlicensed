import {Typewrite} from '@/components/expermtl/typewrite'
import {SectionHeader} from '@/components/ui/section-header'
import {Icon, type IconName} from '@/lib/icons'
import {Button} from '@/lib/heroui'
import {type ReactNode} from 'react'

interface PrimaryButtonProps {
  onPress: VoidFunction
  icon: IconName
  label: string
  disabled?: boolean
  isMobile?: boolean
}

export const PrimaryButton = ({
  onPress,
  icon,
  label,
  disabled,
  isMobile,
}: PrimaryButtonProps) => {
  return (
    <Button
      size='md'
      radius='none'
      color='primary'
      onPress={onPress}
      disabled={disabled}
      isIconOnly={isMobile}
      className='bg-dark-table dark:bg-white dark:text-dark-table rounded-md'>
      <Icon name={icon} className='size-5 opacity-80' />
      <span className='hidden md:flex'>{label}</span>
    </Button>
  )
}

interface LoadingHeaderProps {
  title?: string
}

export const LoadingHeader = ({title}: LoadingHeaderProps) => {
  return (
    <div className='flex w-full'>
      <SectionHeader
        title={
          <Typewrite
            speed={12}
            showCursor={false}
            text={title ?? 'Loading...'}
          />
        }
        className='sm:ps-1'>
        <Button size='md' disabled variant='tertiary'>
          <Icon name='spinner-dots' className='mr-1 size-5 opacity-80' />
        </Button>
      </SectionHeader>
    </div>
  )
}

interface ContentHeaderProps {
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
}

export const ContentHeader = ({
  title,
  description,
  children,
}: ContentHeaderProps) => {
  return (
    <div className='flex items-start w-full min-h-20'>
      <SectionHeader
        title={title}
        className='sm:ps-1'
        description={description}>
        {children}
      </SectionHeader>
    </div>
  )
}
