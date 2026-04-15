'use client'

import {useDealConfigs} from '@/app/lobby/(store)/deals/hooks/use-deal-configs'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Icon} from '@/lib/icons'
import {getBundleTotalCents, getUnitPriceCents} from '@/utils/cartPrice'
import {formatPrice} from '@/utils/formatPrice'
import {mapNumericFractions} from '@/utils/denominationMaps'
import {
  getParamKeysForDealId,
  serializeSelections,
} from '@/app/lobby/(store)/deals/searchParams'
import {Button} from '@heroui/react'
import {useRouter} from 'next/navigation'
import {useMemo, useTransition} from 'react'

import {LegacyImage} from '@/components/ui/legacy-image'

export interface BundleCartItemData {
  bundleType: string
  variationIndex: number
  bundleItemsWithProducts: Array<{
    productId: string
    quantity: number
    denomination: number
    product: {
      _id: string
      name?: string
      image?: string
      onSale?: boolean
      priceCents?: number
      priceByDenomination?: Record<string, number>
      salePriceByDenomination?: Record<string, number>
    }
  }>
}

interface BundleCartItemProps {
  item: BundleCartItemData
  itemIndex: number
  onRemove: (itemIndex: number) => Promise<void>
  onEdit?: (itemIndex: number) => Promise<void>
  isPending?: boolean
}

function getBundleEditHref(item: BundleCartItemData): string {
  const keys = getParamKeysForDealId(item.bundleType)
  const selections = new Map<
    string,
    {productId: string; quantity: number}
  >()

  for (const bundleItem of item.bundleItemsWithProducts) {
    if (bundleItem.quantity <= 0) continue
    const existing = selections.get(bundleItem.productId)
    selections.set(bundleItem.productId, {
      productId: bundleItem.productId,
      quantity: (existing?.quantity ?? 0) + bundleItem.quantity,
    })
  }

  const params = new URLSearchParams({
    [keys.v]: String(item.variationIndex),
    [keys.s]: serializeSelections(selections),
  })

  return `/lobby/deals?${params.toString()}#${encodeURIComponent(item.bundleType)}`
}

export function BundleCartItem({
  item,
  itemIndex,
  onRemove,
  onEdit,
  isPending = false,
}: BundleCartItemProps) {
  const router = useRouter()
  const {configs} = useDealConfigs()
  const config = configs[item.bundleType]
  const variation = config?.variations[item.variationIndex]
  const [isEditing, startEditTransition] = useTransition()

  const productImageIds = useMemo(
    () =>
      item.bundleItemsWithProducts
        .map((bi) => bi.product?.image)
        .filter(Boolean) as string[],
    [item.bundleItemsWithProducts],
  )
  const resolveUrl = useStorageUrls(productImageIds)

  const totalPriceCents = useMemo(() => {
    if (!variation) return 0
    const denom = variation.denominationPerUnit
    const bundleAmount = variation.totalUnits * denom
    const products = item.bundleItemsWithProducts.map((bi) => bi.product)
    return getBundleTotalCents(products, denom, bundleAmount)
  }, [item.bundleItemsWithProducts, variation])

  const subtotalCents = useMemo(() => {
    let sum = 0
    for (const bi of item.bundleItemsWithProducts) {
      const price = getUnitPriceCents(bi.product, bi.denomination)
      sum += price * bi.quantity
    }
    return sum
  }, [item.bundleItemsWithProducts])

  const savingsCents = Math.max(0, subtotalCents - totalPriceCents)

  const title = config?.title ?? 'Bundle'
  const editHref = useMemo(() => getBundleEditHref(item), [item])
  const isActionPending = isPending || isEditing

  const handleEdit = () => {
    if (isActionPending) return

    startEditTransition(async () => {
      await (onEdit ?? onRemove)(itemIndex)
      router.push(editHref)
    })
  }

  return (
    <div className='flex gap-3 p-3 first:rounded-t-2xl last:rounded-b-2xl border-terpenes border border-b-0 last:border-b bg-card/50'>
      <div className='flex-1 min-w-0 flex flex-col justify-between gap-1'>
        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0'>
            <h3 className='flex items-center font-medium font-okxs space-x-4 text-base tracking-tight truncate'>
              <span>{title}</span>
              {savingsCents > 0 && (
                <div className='flex items-center justify-center bg-sidebar dark:text-white dark:bg-terpenes rounded-md px-2'>
                  <span className='text-sm'>
                    <span className='text-xs md:text-sm'>Saved</span>
                    <span className='font-medium md:font-semibold ml-1'>
                      ${(savingsCents / 100).toFixed(0)}
                    </span>
                  </span>
                </div>
              )}
            </h3>
            {variation && (
              <p className='text-sm md:text-base text-muted-foreground font-okxs mb-2'>
                {variation.totalUnits} ×{' '}
                {mapNumericFractions[variation.denominationPerUnit]}{' '}
                {variation.unitLabel}
              </p>
            )}
            {item.bundleItemsWithProducts.length > 0 && (
              <ul className='text-sm text-muted-foreground font-okxs mt-1.5 space-y-1'>
                {item.bundleItemsWithProducts.map((bi) => {
                  const imgId = bi.product?.image
                  const url = imgId ? resolveUrl(imgId) : null
                  return (
                    <li key={bi.productId} className='flex items-center gap-2'>
                      <div className='w-8 h-8 shrink-0 rounded-md overflow-hidden bg-muted'>
                        {url ? (
                          <LegacyImage
                            src={url}
                            alt={bi.product?.name ?? 'Product'}
                            loading='lazy'
                            className='h-full w-full object-cover'
                          />
                        ) : (
                          <div className='w-full h-full flex items-center justify-center'>
                            <Icon
                              name='bag-solid'
                              className='size-4 text-muted-foreground'
                            />
                          </div>
                        )}
                      </div>
                      <span className='md:text-base'>
                        {bi.product?.name ?? 'Product'}{' '}
                        {bi.quantity > 1 && (
                          <span className='text-muted-foreground/80'>
                            × {bi.quantity}
                          </span>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          <p className='font-okxs font-medium text-lg shrink-0'>
            ${formatPrice(totalPriceCents)}
          </p>
        </div>
        <div className='flex items-center justify-end gap-2'>
          <Button
            size='sm'
            variant='ghost'
            className='h-7 rounded-xs px-2 text-sm font-okxs'
            isDisabled={isActionPending}
            onPress={handleEdit}>
            <span className='flex items-center gap-1'>
              <Icon name='pencil-fill' className='size-3.5' />
              <span>Edit</span>
            </span>
          </Button>
          <Button
            size='sm'
            isIconOnly
            variant='tertiary'
            className='min-w-8 w-8 h-7 aspect-square rounded-sm text-muted-foreground opacity-80 hover:opacity-100'
            isDisabled={isActionPending}
            onPress={() => onRemove(itemIndex)}>
            <Icon name='trash' className='size-6' />
          </Button>
        </div>
      </div>
    </div>
  )
}
