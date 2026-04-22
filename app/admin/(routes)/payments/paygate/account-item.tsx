import {GatewayWallet} from '@/convex/gateways/d'
import {useCopy} from '@/hooks/use-copy'
import {useOverlayState} from '@heroui/react'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatDate} from '@/utils/date'
import {
  Accordion,
  Button,
  Modal,
  ModalBody,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
} from '@heroui/react'
import {ReactNode, useEffect, useMemo, useRef, useState} from 'react'

export interface ItemDetailProps {
  label: string
  isDefault?: 'true' | 'false'
  hexAddress?: `0x${string}`
  description?: string
  rank?: string
  usage?: string[]
  locations?: string[]
  quantity?: string
  weight?: string
  value?: string
  isTracked?: boolean
}

interface WalletDetail {
  id: string
  label: string
  value: string
}

export function AccountItemCard({
  label,
  isDefault = false,
  hexAddress,
  createdAt,
  onEdit,
  onRefresh,
  onDelete,
  addressIn,
  callbackUrl,
  polygonAddressIn,
  affiliateWallet,
}: GatewayWallet & {
  onEdit: VoidFunction
  onRefresh?: VoidFunction
  onDelete?: VoidFunction
}) {
  const details = useMemo(
    () =>
      [
        {id: 'addressIn', label: 'Address In', value: addressIn},
        {id: 'callbackUrl', label: 'Callback URL', value: callbackUrl},
        {
          id: 'polygonAddressIn',
          label: 'Polygon Address In',
          value: polygonAddressIn,
        },
        {
          id: 'affiliateWallet',
          label: 'Affiliate Wallet',
          value: affiliateWallet,
        },
      ] as Array<WalletDetail>,
    [addressIn, callbackUrl, polygonAddressIn, affiliateWallet],
  )

  const {copy, copied} = useCopy({timeout: 2000})
  const {copy: copyDetail} = useCopy({timeout: 2000})
  const [copiedDetailId, setCopiedDetailId] = useState<string | null>(null)
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    }
  }, [])

  const modalState = useOverlayState()
  const {open: onOpen, close: onClose} = modalState

  const handleCopyHex = () => copy('address', hexAddress)
  const handleDeleteClick = () => onOpen()
  const handleConfirmDelete = () => {
    onDelete?.()
    onClose()
  }

  const handleCopyDetail = (id: string) => () => {
    const value = details.find((d) => d.id === id)?.value ?? ''
    copyDetail(id, value)
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    setCopiedDetailId(id)
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedDetailId(null)
    }, 2000)
  }

  return (
    <div className='w-full bg-sidebar/40 dark:bg-dark-table/40 rounded-t-md rounded-b-xl overflow-hidden select-none border border-foreground/80 dark:border-foreground/20 animate-in fade-in zoom-in duration-200'>
      {/* Header */}
      <div className='flex items-center justify-between border-b border-foreground/80 dark:border-foreground/40'>
        <DefaultState isDefault={isDefault} />
        <div />
      </div>

      {/* Title Section */}
      <div className='p-4 flex flex-col gap-1'>
        <h2 className='text-xl font-semibold font-polysans uppercase mt-1 leading-tight'>
          {label ?? 'Account 1'}
        </h2>
      </div>

      {/* Subtext */}
      <div className=' pb-2'>
        <div className='flex min-w-0 items-center gap-2 px-4'>
          <Icon name='wallet' className='size-5 shrink-0 opacity-80' />
          <h3 className='min-w-0 max-w-[32ch] truncate font-mono text-xs font-light lowercase leading-none tracking-widest'>
            {hexAddress}
          </h3>
          <Icon
            name={copied ? 'check' : 'copy'}
            className='size-4'
            onClick={handleCopyHex}
          />
        </div>
      </div>
      <div>
        <Accordion className='rounded-lg'>
          {details.map(({id, label, value}) => (
            <Accordion.Item
              key={id}
              id={id}
              className='bg-sidebar/0 dark:bg-sidebar px-2 whitespace-normal font-okxs text-xs'
            >
              <Accordion.Heading>
                <Accordion.Trigger className='flex items-center gap-4'>
                  <span>{label}</span>
                  {copiedDetailId === id && (
                    <div className='flex items-center'>
                      <span className='text-xs font-brk uppercase'>Copied</span>
                      <Icon name='check' className='size-3' />
                    </div>
                  )}
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body
                  onClick={handleCopyDetail(id as keyof WalletDetail)}
                  className='cursor-pointer break-all font-mono text-sm whitespace-normal'
                >
                  {value}
                </Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
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
      <div className='grid grid-cols-3 border-t border-sidebar bg-sidebar/60 dark:bg-dark-table/30'>
        <ActionItem value={'edit'} onClick={onEdit} />
        <ActionItem value={'refresh'} onClick={onRefresh} />
        <ActionItem
          value={'delete'}
          icon={<Icon name='trash' className='w-3 h-3 fill-current' />}
          onClick={handleDeleteClick}
        />
      </div>

      <Modal state={modalState}>
        <ModalBackdrop>
          <ModalContainer size='md' placement='center'>
            <ModalDialog className='rounded-lg'>
              <ModalHeader className='font-okxs font-semibold'>
                Delete account?
              </ModalHeader>
              <ModalBody>
                <p className='text-sm text-muted-foreground'>
                  Are you sure you want to delete{' '}
                  <span className='font-semibold'>
                    {label ?? 'this account'} ?
                  </span>
                  <span className='break-all font-mono text-brand'>
                    {hexAddress}
                  </span>{' '}
                  <br />
                  <span className='font-brk'>(!)</span> This cannot be undone.
                </p>
              </ModalBody>
              <ModalFooter className='gap-2'>
                <Button variant='tertiary' onPress={onClose}>
                  Cancel
                </Button>
                <Button variant='danger' onPress={handleConfirmDelete}>
                  Delete
                </Button>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </Modal>
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
    )}
  >
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
      className={cn(
        'h-10 flex items-center justify-center border-r border-sidebar last:border-r-0 gap-1.5',
        onClick && 'cursor-pointer hover:bg-sidebar/40',
      )}
    >
      {icon && <span className='opacity-60'>{icon}</span>}
      <span className='text-xs font-medium'>{value}</span>
      {sub && <span className='text-[10px] opacity-40'>{sub}</span>}
    </div>
  )
}
