import {SectionHeader} from '@/components/ui/section-header'
import {Icon, IconName} from '@/lib/icons'
import {Button} from '@heroui/react'

interface PrimaryButtonProps {
  onPress: VoidFunction
  icon: IconName
  label: string
  disabled?: boolean
}

export const PrimaryButton = ({
  onPress,
  icon,
  label,
  disabled,
}: PrimaryButtonProps) => {
  return (
    <Button
      size='md'
      radius='none'
      color='primary'
      onPress={onPress}
      disabled={disabled}
      className='bg-dark-table dark:bg-white dark:text-dark-table rounded-lg'>
      <Icon name={icon} className='mr-1 size-4 opacity-80' />
      <span>{label}</span>
    </Button>
  )
}

interface LoadingHeaderProps {
  title?: string
}

export const LoadingHeader = ({title}: LoadingHeaderProps) => {
  return (
    <div className='flex w-full'>
      <SectionHeader title={title}>
        <Button size='md' disabled variant='light'>
          <Icon name='spinner-dots' className='mr-1 size-5 opacity-80' />
        </Button>
      </SectionHeader>
    </div>
  )
}
