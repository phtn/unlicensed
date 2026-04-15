import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {cn} from '@/lib/utils'

interface Recipient {
  name: string
  email: string
}
interface MailingListTableProps {
  recipients: Recipient[]
  className?: string
}
export const MailingListTable = ({
  recipients,
  className,
}: MailingListTableProps) => {
  return (
    <div className={cn('flex w-full flex-col', className)}>
      <Table>
        <TableHeader className='tracking-widest font-ios text-xs'>
          <TableRow className='uppercase opacity-60'>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recipients.map((recipient, index) => (
            <TableRow key={index} className='even:bg-foreground/3'>
              <TableCell>
                <div className='flex items-center gap-3'>
                  <span className='text-sm'>{recipient.name}</span>
                </div>
              </TableCell>
              <TableCell className='tracking-wider font-mono'>
                {recipient.email}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
