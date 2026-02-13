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
        'dark:bg-dark-table/40 px-4 pb-4 border-x border-t border-gray-300 dark:border-origin',
        {
          'rounded-sm': position === 'top',
          'border-b rounded-b-2xl': position === 'bottom',
        },
      )}>
      {children}
    </Card>
  )
}

interface HeaderProps {
  label: string
  children?: ReactNode
}
export const Header = ({label, children}: HeaderProps) => {
  return (
    <CardHeader className='px-0 font-polysans font-medium'>
      <div className='flex items-center justify-between w-full'>
        <h2>{label}</h2>
      </div>
      <div>{children}</div>
    </CardHeader>
  )
}
