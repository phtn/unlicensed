import {cn} from '@/lib/utils'
import {Card, CardHeader} from '@heroui/react'
import {ReactNode} from 'react'

interface FormSectionProps {
  id: string
  position?: 'top' | 'middle' | 'bottom'
  children?: ReactNode
}

export const FormSection = ({
  id,
  position = 'middle',
  children,
}: FormSectionProps) => {
  return (
    <Card
      id={id}
      radius='none'
      shadow='none'
      className={cn(
        'dark:bg-dark-table/40 p-4 border-x border-t border-gray-300 dark:border-origin',
        {
          'rounded-none border-t-0': position === 'top',
          'border-b rounded-b-2xl': position === 'bottom',
        },
      )}>
      {children}
    </Card>
  )
}

export const Header = ({label}: {label: string}) => {
  return (
    <CardHeader className='tracking-tight px-0 font-semibold'>
      <h2>{label}</h2>
    </CardHeader>
  )
}
