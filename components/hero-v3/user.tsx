import {HeroAvatarImage} from '@/components/ui/heroui-avatar-image'
import {Avatar} from '@heroui/react'

export const User = ({
  name,
  avatar,
  className,
}: {
  name: string
  avatar?: string
  className?: string
}) => {
  return (
    <Avatar className={className}>
      <HeroAvatarImage src={avatar} alt={name} />
      <Avatar.Fallback className='text-sm'>{name}</Avatar.Fallback>
    </Avatar>
  )
}
