import {IconCloud} from '@/components/ui/icon-cloud'
import {Icon, IconName} from '@/lib/icons'

export const BrandCloud = ({iconNames}: {iconNames: IconName[]}) => {
  const icons = iconNames.map((iconName) => (
    <Icon key={iconName} name={iconName} size={100} />
  ))

  return (
    <div className='flex min-h-72 items-center justify-center overflow-hidden! sm:min-h-96'>
      <IconCloud icons={icons} className='h-160 w-160 text-foreground' />
    </div>
  )
}
