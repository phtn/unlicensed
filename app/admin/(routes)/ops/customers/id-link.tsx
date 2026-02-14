import {Doc} from '@/convex/_generated/dataModel'
import {CellContext} from '@tanstack/react-table'
import Link from 'next/link'

export const idLink = () => {
  const IDCellComponent = (ctx: CellContext<Doc<'users'>, unknown>) => {
    const fid = ctx.getValue() as string | undefined
    if (!fid) return <span className='text-muted-foreground'>—</span>

    return (
      <div className='flex flex-col w-fit'>
        <Link
          color='foreground'
          prefetch
          href={`/admin/ops/customers/${fid}`}
          className='font-brk opacity-80 text-sm hover:underline underline-offset-2 decoration-dotted decoration-foreground/40 uppercase text-mac-blue'>
          {fid.substring(24)}
        </Link>
      </div>
    )
  }
  IDCellComponent.displayName = 'IDCellComponent'
  return IDCellComponent
}
