import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Popover, PopoverContent, PopoverTrigger} from '@/lib/heroui'

type PriceOption = {
  price: string
  denom: string
  denominationValue: number
}
interface PopoverOptionsProps {
  priceOptions?: PriceOption[]
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  productId?: string
  addItem?: (productId: string) => void
}

export const PopoverOptions = ({
  priceOptions,
  isOpen,
  onOpenChange,
  productId,
  addItem,
}: PopoverOptionsProps) => {
  return (
    <div className=' flex items-center justify-end whitespace-nowrap text-base sm:text-lg font-okxs text-foreground shrink-0 w-fit'>
      {priceOptions ? (
        <Popover
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          placement='top'
          offset={12}
          crossOffset={4}
          showArrow>
          <PopoverTrigger>
            <button
              type='button'
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              className='font-okxs h-7 text-base sm:text-base hover:bg-sidebar/80 bg-sidebar/50 md:bg-transparent shadow-none min-w-0 w-fit text-left transition-opacity text-brand px-2 rounded-md'>
              <span className='hidden md:flex tracking-tight'>Add to cart</span>
              <span className=' md:hidden flex items-center tracking-tight'>
                <Icon name='plus' className='size-4' />
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className='w-44 md:w-52 p-1.5 md:p-2 dark:border-sidebar dark:bg-dark-table'>
            <div className='flex flex-col gap-0.5 w-full'>
              {priceOptions.map((opt) => (
                <button
                  key={opt.denominationValue}
                  type='button'
                  disabled={!productId}
                  onClick={addItem ? () => addItem(productId!) : undefined}
                  className={cn(
                    'flex items-center justify-between w-full rounded-lg p-2 text-sm md:text-base transition-colors font-okxs font-medium',
                    productId
                      ? 'hover:bg-brand hover:text-white active:bg-default-200'
                      : 'opacity-70 cursor-not-allowed',
                  )}>
                  <p className=''>${opt.price}</p>
                  <p>{opt.denom}</p>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  )
}
