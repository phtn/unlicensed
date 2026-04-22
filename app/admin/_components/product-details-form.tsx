'use client'

import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {useSaveAdminProductFormReturn} from '@/hooks/use-save-admin-product-form-return'
import {
  getStockDisplayUnit,
  getTotalStock,
  usesSharedWeightInventory,
} from '@/lib/productStock'
import {Button, Switch, TextArea} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import Link from 'next/link'
import {useEffect, useState} from 'react'
import {useProductDetailsSafe} from './product-details-context'
import {useSettingsPanelSafe} from './ui/settings'

import {Input} from '@/components/hero-v3/input'
import {LegacyImage} from '@/components/ui/legacy-image'

type Product = Doc<'products'>

interface ProductDetailsFormProps {
  product: Product
  hideHeader?: boolean
}

export function ProductDetailsForm({product}: ProductDetailsFormProps) {
  const productDetailsContext = useProductDetailsSafe()
  const settingsPanelContext = useSettingsPanelSafe()
  const saveAdminProductFormReturn = useSaveAdminProductFormReturn()
  const updateProduct = useMutation(api.products.m.updateProduct)
  const productImageUrl = useQuery(
    api.products.q.getPrimaryImage,
    product.image ? {id: product._id} : 'skip',
  )

  const [priceCents, setPriceCents] = useState(product.priceCents)
  const [unit, setUnit] = useState(product.unit)
  const [available, setAvailable] = useState(product.available)
  const [featured, setFeatured] = useState(product.featured)
  const [isSaving, setIsSaving] = useState(false)
  const currentStock = getTotalStock(product)

  // Sync form state when product changes
  useEffect(() => {
    setPriceCents(product.priceCents)
    setUnit(product.unit)
    setAvailable(product.available)
    setFeatured(product.featured)
  }, [product])

  const handleToggleAvailable = async () => {
    const newValue = !available
    setAvailable(newValue)
    setIsSaving(true)
    try {
      await updateProduct({
        id: product._id,
        fields: {available: newValue},
      })
    } catch (error) {
      console.error('Failed to update availability:', error)
      // Revert on error
      setAvailable(!newValue)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleFeatured = async () => {
    const newValue = !featured
    setFeatured(newValue)
    setIsSaving(true)
    try {
      await updateProduct({
        id: product._id,
        fields: {featured: newValue},
      })
    } catch (error) {
      console.error('Failed to update featured status:', error)
      // Revert on error
      setFeatured(!newValue)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAllChanges = async () => {
    setIsSaving(true)
    try {
      // Build update object with only changed fields
      const fields: {
        priceCents?: number
        unit?: string
      } = {}

      // Only include fields that have changed
      if (priceCents !== product.priceCents) {
        fields.priceCents = priceCents
      }
      if (unit !== product.unit) {
        fields.unit = unit
      }

      // Only call update if there are changes
      if (Object.keys(fields).length > 0) {
        await updateProduct({
          id: product._id,
          fields,
        })
      }
    } catch (error) {
      console.error('Failed to save changes:', error)
      // Revert form state on error
      setPriceCents(product.priceCents)
      setUnit(product.unit)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (settingsPanelContext) {
      settingsPanelContext.setOpen(false)
      productDetailsContext?.clearSelectedProduct()
    }
  }

  return (
    <div className='flex flex-col min-h-0 gap-x-4 gap-y-8'>
      {/* Product Image */}
      <div className='flex justify-center'>
        <LegacyImage
          src={productImageUrl ?? '/default-product-image.svg'}
          alt={product.name}
          className='w-32 h-32 object-cover rounded-lg'
        />
      </div>

      {/* Product Name */}
      {/*<div>
        <label className='text-xs font-medium text-foreground/60 mb-1 block'>
          Product Name
        </label>
        <Input
          size='md'
          value={name}
          onValueChange={setName}
          placeholder='Product name'
        />
      </div>*/}
      {/* Description */}
      {product.description && (
        <div>
          <TextArea
            value={product.description}
            readOnly
            rows={3}
            className='text-xs bg-transparent! dark:bg-transparent!'
          />
        </div>
      )}
      {/* Price */}

      <div className='grid grid-cols-1 items-center gap-4 sm:grid-cols-3'>
        <div className='w-full'>
          <Input
            label='Price'
            type='number'
            value={String(priceCents)}
            onChange={(value) => setPriceCents(Number(value))}
            placeholder='Price in cents'
          />
        </div>
        <div>
          <div className='w-full'>
            <Input
              label='Unit'
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder='Unit'
            />
          </div>
        </div>
        <div className='w-full'>
          <Input
            label={
              usesSharedWeightInventory(product)
                ? `Master stock${getStockDisplayUnit(product) ? ` (${getStockDisplayUnit(product)})` : ''}`
                : 'Qty in stock'
            }
            value={String(currentStock)}
            placeholder='Stock quantity'
          />
        </div>
      </div>

      <div className='rounded-lg border border-black/5 bg-black/2 p-3 text-sm text-foreground/70 dark:border-white/10 dark:bg-white/3'>
        Inventory counts now use the dedicated inventory adjustment flow so
        every restock and correction is logged.
        <div className='mt-3'>
          <Link
            href={`/admin/inventory/product/${product._id}#inventory`}
            onClick={saveAdminProductFormReturn}
          >
            <Button size='sm' variant='secondary'>
              Open Inventory Controls
            </Button>
          </Link>
        </div>
      </div>

      {/* Status */}
      <div className='flex gap-3'>
        <div className='flex w-full flex-col justify-between gap-3 sm:flex-row sm:gap-5'>
          <div className='flex w-full items-center justify-between gap-3 rounded border border-emerald-400 bg-emerald-200/5 p-3'>
            <div className='flex min-w-0 flex-col'>
              <span className='text-sm font-medium'>Available</span>
              <span className='text-xs text-foreground/60'>
                {available
                  ? 'Product is available for purchase'
                  : 'Product is unavailable'}
              </span>
            </div>
            <Switch
              isSelected={available}
              onChange={handleToggleAvailable}
              isDisabled={isSaving}
              size='sm'
            >
              <Switch.Control className='bg-emerald-500'>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
          </div>
          <div className='flex w-full items-center justify-between gap-3 rounded border border-featured bg-featured/5 p-3'>
            <div className='flex min-w-0 flex-col'>
              <span className='text-sm font-medium'>Featured</span>
              <span className='text-xs text-foreground/60'>
                {featured ? 'Product is featured' : 'Product is not featured'}
              </span>
            </div>
            <Switch
              isSelected={featured}
              onChange={handleToggleFeatured}
              isDisabled={isSaving}
              size='sm'
            >
              <Switch.Control className='bg-featured'>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className='flex flex-col gap-3 pt-2 sm:flex-row sm:gap-4'>
        <Button size='lg' className='flex-1' onPress={handleCancel}>
          Cancel
        </Button>
        <Button
          size='lg'
          className='flex-1 bg-featured'
          onPress={handleSaveAllChanges}
        >
          Save Changes
        </Button>
      </div>
    </div>
  )
}
