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
      <Avatar.Image src={avatar} alt={name} />
      <Avatar.Fallback>{name}</Avatar.Fallback>
    </Avatar>
  )
}
