import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {Table, TableBody, TableCell, TableRow} from '@/components/ui/table'
import {ReactNode} from 'react'

interface CompactInfoProps {
  data: {
    key: string
    value: ReactNode
  }[]
}
export const CompactInfo = ({data}: CompactInfoProps) => {
  return (
    <div className='mx-auto flex w-full max-w-lg flex-col'>
      <div className='bg-background overflow-hidden rounded-md border'>
        <Table>
          <TableBody>
            {data.map((info) => (
              <TableRow
                key={info.key}
                className='*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r'>
                <TableCell className='bg-alum/12 w-40 py-2 text-xs font-ios uppercase tracking-[0.12em] text-foreground/45'>
                  {info.key}
                </TableCell>
                <TableCell className='py-2 break-all font-mono tracking-wide text-xs text-foreground/80'>
                  {info.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
export const AvatarCell = () => (
  <TableCell className='py-2'>
    <div className='flex items-center gap-2'>
      <Avatar size='sm'>
        <AvatarImage
          src='https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&dpr=2&q=80'
          alt='Sarah Chen'
        />
        <AvatarFallback>SC</AvatarFallback>
      </Avatar>
      <div className='flex flex-col leading-none'>
        <span className='text-sm font-medium'>Sarah Chen</span>
        <span className='text-muted-foreground text-xs'>
          Lead Product Designer
        </span>
      </div>
    </div>
  </TableCell>
)
