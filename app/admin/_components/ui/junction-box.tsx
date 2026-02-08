import {cn} from '@/lib/utils'
import {Card, Switch} from '@heroui/react'

interface JunctionBoxProps {
  title: string
  onUpdate: (value: boolean) => void
  checked: boolean
  description?: string
}
export const JunctionBox = ({
  title,
  checked,
  onUpdate,
  description,
}: JunctionBoxProps) => {
  const handleCardToggle = () => onUpdate(!checked)
  return (
    <Card
      radius='none'
      shadow='none'
      isPressable
      disableRipple
      onPress={handleCardToggle}
      className='flex flex-col gap-2 pt-3 pb-4 pl-4 pr-3 rounded-lg bg-alum/20 dark:bg-background/30'>
      <div className='flex items-center justify-between font-okxs w-full'>
        <h2 className='text-lg font-polysans font-medium'>{title}</h2>
        <div onClick={(event) => event.stopPropagation()}>
          <Switch
            size='sm'
            color='success'
            isSelected={checked}
            onValueChange={onUpdate}
            className='scale-80'
            classNames={{
              thumb: cn('dark:bg-slate-100 dark:text-white', {
                'dark:text-slate-100': checked,
              }),
              wrapper: cn('dark:bg-slate-200/20', {
                'dark:bg-emerald-400': checked,
              }),
            }}
          />
        </div>
      </div>
      <p className='text-xs text-left'>{description}</p>
    </Card>
  )
}
