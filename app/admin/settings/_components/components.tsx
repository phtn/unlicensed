import {Typewrite} from '@/components/expermtl/typewrite'
import {SectionHeader} from '@/components/ui/section-header'
import {Icon, type IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
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
}: PrimaryButtonProps) => {
  return (
    <Button
      size='sm'
      onPress={onPress}
      isDisabled={disabled}
      className='bg-dark-table dark:bg-white dark:text-dark-table rounded-md h-7 my-1.5'>
      <Icon
        name={icon}
        className={cn('size-4 opacity-80', {hidden: disabled})}
      />

      <span className='md:flex'>{label}</span>
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
        <Button size='md' isDisabled variant='tertiary' className='h-7'>
          <Icon name='spinner-dots' className='mr-1 size-4 opacity-80' />
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
    <div className='flex items-start w-full md:w-[78vw] min-h-20'>
      <SectionHeader title={title} className='ps-2' description={description}>
        {children}
      </SectionHeader>
    </div>
  )
}
