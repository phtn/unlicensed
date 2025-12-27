import {Doc} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatDate} from '@/utils/date'
import {Accordion, AccordionItem} from '@heroui/react'
import {ReactNode} from 'react'

export interface ItemDetailProps {
  label: string
  isDefault?: 'true' | 'false'
  hexAddress: string
  description?: string
  rank?: string
  usage?: string[]
  locations?: string[]
  quantity?: string
  weight?: string
  value?: string
  isTracked?: boolean
}

export function AccountItemCard({
  label,
  isDefault = false,
  hexAddress,
  createdAt,
  onEdit,
  addressIn,
  callbackUrl,
  polygonAddressIn,
  affiliateWallet,
}: Doc<'paygateAccounts'> & {onEdit: VoidFunction}) {
  return (
    <div className='w-[320px] bg-sidebar/40 dark:bg-dark-table/40 rounded-t-md rounded-b-xl overflow-hidden select-none border border-foreground/80 dark:border-foreground/20 animate-in fade-in zoom-in duration-200'>
      {/* Header */}
      <div className='flex items-center justify-between border-b border-foreground/80 dark:border-foreground/40'>
        <DefaultState isDefault={isDefault} />
        <div />
      </div>

      {/* Title Section */}
      <div className='p-4 flex flex-col gap-1'>
        <h2 className='text-2xl font-semibold font-polysans uppercase mt-1 leading-tight'>
          {label ?? 'Account 1'}
        </h2>
      </div>

      {/* Description */}
      <div className='px-4 pb-4'>
        <div className='flex items-center gap-2'>
          <Icon name='wallet' className='size-5' />
          <h3 className='text-xs font-mono font-light tracking-widest lowercase leading-none '>
            {hexAddress}
          </h3>
        </div>

        {/* Usage info */}
        {/*{usage.length > 0 && (
          <div className='bg-black/5 rounded-sm p-3 flex gap-3 items-start mb-4'>
            <Icon
              name='info'
              className='w-4 h-4 text-black/40 mt-0.5 shrink-0'
            />
            <p className='text-[10px] font-bold leading-tight'>
              <span className='opacity-60'>Used to craft: </span>
              {usage.join(', ')}
            </p>
          </div>
        )}*/}

        {/* Locations */}
        {/*{locations.length > 0 && (
          <div className='flex flex-col gap-2 mb-4'>
            <h4 className='text-[10px] font-black tracking-widest uppercase opacity-40'>
              Can be found in:
            </h4>
            {locations.map((loc, i) => (
              <div key={i} className='flex items-center gap-2'>
                <Icon name='info' className='w-3 h-3 rotate-45 text-black/60' />
                <span className='text-[10px] font-bold'>{loc}</span>
              </div>
            ))}
          </div>
        )}*/}

        {/* Quest tracking */}
        {/*{isTracked && (
          <div className='bg-black/5 rounded-sm p-3 flex items-center gap-3'>
            <div className='w-4 h-4 rounded-full border-2 border-black/20 flex items-center justify-center'>
              <div className='w-1.5 h-1.5 bg-black rounded-full' />
            </div>
            <span className='text-[10px] font-bold uppercase tracking-wider'>
              Tracked for quest
            </span>
          </div>
        )}*/}
      </div>
      <div>
        <Accordion className='rounded-lg'>
          <AccordionItem
            key='1'
            aria-label='address_in'
            title='address_in'
            className='bg-sidebar/0 dark:bg-sidebar px-4 whitespace-normal font-space'>
            {addressIn}
          </AccordionItem>
          <AccordionItem
            className='bg-sidebar/0 dark:bg-sidebar px-4 whitespace-normal font-space'
            key='2'
            aria-label='callback_url'
            title='callback_url'>
            {callbackUrl}
          </AccordionItem>
          <AccordionItem
            className='bg-sidebar/0 dark:bg-sidebar px-4 whitespace-normal font-space'
            key='3'
            aria-label='polygon_address_in'
            title='polygon_address_in'>
            {polygonAddressIn}
          </AccordionItem>
          <AccordionItem
            className='bg-sidebar/0 dark:bg-sidebar px-4 whitespace-normal font-space'
            key='4'
            aria-label='affiliate wallet'
            title='affiliate wallet'>
            {affiliateWallet}
          </AccordionItem>
        </Accordion>
      </div>
      {/* More Actions Interaction */}
      <div className=' h-8 flex items-center justify-end px-4 gap-1 opacity-70'>
        <Icon name='time' className='size-3 opacity-80' />
        <div className='text-xs font-space font-light'>
          {createdAt && formatDate(createdAt)}
        </div>
      </div>
      {/* Footer Stats */}
      <div className='grid grid-cols-3 border-y border-sidebar bg-sidebar/60 dark:bg-dark-table/30'>
        <ActionItem value={'edit'} onClick={onEdit} />
        <ActionItem value={'refresh'} />
        <ActionItem
          value={'delete'}
          icon={<Icon name='info' className='w-3 h-3 fill-current' />}
        />
      </div>
    </div>
  )
}
interface DefaultStateProps {
  isDefault: boolean
}
const DefaultState = ({isDefault}: DefaultStateProps) => (
  <div
    className={cn(
      'flex items-center uppercase justify-center w-full h-10 font-mono shadow-none bg-gray-600/20 dark:bg-gray-400/45 text-white',
      {'bg-indigo-500 dark:bg-blue-400/45': isDefault},
    )}>
    <p className='text-xs tracking-wider font-normal whitespace-nowrap drop-shadow-xs'>
      {isDefault ? 'Default' : ''}
    </p>
  </div>
)
interface ActionItemProps {
  value: string
  sub?: string
  icon?: ReactNode
  onClick?: VoidFunction
}
function ActionItem({value, sub, icon, onClick}: ActionItemProps) {
  return (
    <div
      onClick={onClick}
      className='h-10 flex items-center justify-center border-r border-sidebar last:border-r-0 gap-1.5'>
      {icon && <span className='opacity-60'>{icon}</span>}
      <span className='text-xs font-medium'>{value}</span>
      {sub && <span className='text-[10px] opacity-40'>{sub}</span>}
    </div>
  )
}
