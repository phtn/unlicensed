export const StatusBadge = () => {
  return (
    <div className='flex flex-wrap gap-1'>
      <span
        data-slot='badge'
        className='aria-invalid:ring-destructive/20 inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-full whitespace-nowrap transition-all [&amp;&gt;svg]:pointer-events-none [&amp;&gt;svg]:size-3 px-2.5 py-0.5 text-foreground text-xs'>
        <div className='flex items-center gap-1.5'>
          <div
            className='size-2 rounded-full bg-amber-200'
            aria-hidden='true'
          />
          <span>Status</span>
        </div>
      </span>
    </div>
  )
}
