'use client'

import {api} from '@/convex/_generated/api'
import type {Doc, Id} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Chip, Image, Input, Switch, Textarea} from '@heroui/react'
import {useMutation} from 'convex/react'
import {useEffect, useState} from 'react'
import {useProductDetailsSafe} from './product-details-context'
import {useSettingsPanelSafe} from './ui/settings'

type Product = Doc<'products'>

interface ProductDetailsFormProps {
  product: Product
  hideHeader?: boolean
}

export function ProductDetailsForm({product}: ProductDetailsFormProps) {
  const productDetailsContext = useProductDetailsSafe()
  const settingsPanelContext = useSettingsPanelSafe()
  const updateProduct = useMutation(api.products.m.updateProduct)

  const [name, setName] = useState(product.name)
  const [priceCents, setPriceCents] = useState(product.priceCents)
  const [stock, setStock] = useState(product.stock ?? 0)
  const [unit, setUnit] = useState(product.unit)
  const [available, setAvailable] = useState(product.available)
  const [featured, setFeatured] = useState(product.featured)
  const [isSaving, setIsSaving] = useState(false)

  // Sync form state when product changes
  useEffect(() => {
    setName(product.name)
    setPriceCents(product.priceCents)
    setStock(product.stock ?? 0)
    setUnit(product.unit)
    setAvailable(product.available)
    setFeatured(product.featured)
  }, [
    product._id,
    product.name,
    product.priceCents,
    product.stock,
    product.unit,
    product.available,
    product.featured,
  ])

  const handleToggleAvailable = async () => {
    const newValue = !available
    setAvailable(newValue)
    setIsSaving(true)
    try {
      await updateProduct({
        productId: product._id,
        available: newValue,
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
        productId: product._id,
        featured: newValue,
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
      const updates: {
        productId: Id<'products'>
        name?: string
        priceCents?: number
        stock?: number
        unit?: string
      } = {
        productId: product._id,
      }

      // Only include fields that have changed
      if (name !== product.name) {
        updates.name = name
      }
      if (priceCents !== product.priceCents) {
        updates.priceCents = priceCents
      }
      if (stock !== (product.stock ?? 0)) {
        updates.stock = stock
      }
      if (unit !== product.unit) {
        updates.unit = unit
      }

      // Only call update if there are changes
      if (Object.keys(updates).length > 1) {
        await updateProduct(updates)
      }
    } catch (error) {
      console.error('Failed to save changes:', error)
      // Revert form state on error
      setName(product.name)
      setPriceCents(product.priceCents)
      setStock(product.stock ?? 0)
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
    <div className='flex flex-col min-h-0 gap-4'>
      {/* Product Image */}
      <div className='flex justify-center'>
        <Image
          src={product.image}
          alt={product.name}
          className='w-32 h-32 object-cover rounded-lg'
        />
      </div>

      {/* Product Name */}
      <div>
        <label className='text-xs font-medium text-foreground/60 mb-1 block'>
          Product Name
        </label>
        <Input
          size='md'
          value={name}
          onValueChange={setName}
          placeholder='Product name'
        />
      </div>
      {/* Description */}
      {product.description && (
        <div>
          <label className='text-xs font-medium text-foreground/60 mb-1 block'>
            Description
          </label>
          <Textarea
            value={product.description}
            readOnly
            size='sm'
            minRows={3}
            className='text-xs'
          />
        </div>
      )}
      {/* Price */}

      <div className='flex items-center space-x-4'>
        <div className='w-full'>
          <label className='text-xs font-medium text-foreground/60 mb-1 block'>
            Price (cents)
          </label>
          <Input
            size='md'
            type='number'
            value={String(priceCents)}
            onValueChange={(value) => setPriceCents(Number(value))}
            placeholder='Price in cents'
            startContent={<span className='text-xs opacity-60'></span>}
          />
          <p className='text-xs opacity-60 mt-1'>
            <span className='mr-2'>Display:</span>
            <span className='font-space font-medium'>
              <span className='font-thin'>$</span>
              {formatPrice(priceCents, 2)}
            </span>
          </p>
        </div>
        <div className='w-full'>
          <label className='text-xs font-medium text-foreground/60 mb-1 block'>
            In-Stock
          </label>
          <Input
            size='md'
            type='number'
            value={String(stock)}
            onValueChange={(value) => setStock(Number(value))}
            placeholder='Stock quantity'
          />
          <p className='text-xs opacity-60 mt-1'>
            <span className='mr-2'>Unit:</span>
            <span className='font-space font-medium'>{product.unit}</span>
          </p>
        </div>
      </div>
      <div>
        <div className='w-full'>
          <label className='text-xs font-medium text-foreground/60 mb-1 block'>
            Unit
          </label>
          <Input
            size='md'
            value={unit}
            onValueChange={(value) => setUnit(value)}
            placeholder='Unit'
          />
          <p className='text-xs opacity-60 mt-1'>
            <span className='mr-2'>Unit:</span>
            <span className='font-space font-medium'>{product.unit}</span>
          </p>
        </div>
      </div>

      {/* Status */}
      <div className='flex flex-col gap-3'>
        <div>
          <label className='text-xs font-medium text-foreground/60 mb-1 block'>
            Status
          </label>
          <div className='flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <div className='flex flex-col'>
                <span className='text-sm font-medium'>Available</span>
                <span className='text-xs text-foreground/60'>
                  {available
                    ? 'Product is available for purchase'
                    : 'Product is unavailable'}
                </span>
              </div>
              <Switch
                isSelected={available}
                onValueChange={handleToggleAvailable}
                isDisabled={isSaving}
                color='success'
                size='sm'
              />
            </div>
            <div className='flex items-center justify-between'>
              <div className='flex flex-col'>
                <span className='text-sm font-medium'>Featured</span>
                <span className='text-xs text-foreground/60'>
                  {featured ? 'Product is featured' : 'Product is not featured'}
                </span>
              </div>
              <Switch
                isSelected={featured}
                onValueChange={handleToggleFeatured}
                isDisabled={isSaving}
                color='primary'
                size='sm'
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className='text-xs font-medium text-foreground/60 mb-1 block'>
          Category
        </label>
        <Chip size='sm' variant='flat' className='capitalize'>
          {product.categorySlug ?? 'Uncategorized'}
        </Chip>
      </div>

      {/* Actions */}
      <div className='flex gap-2 pt-2'>
        <Button size='lg' className='flex-1' onPress={handleCancel}>
          Cancel
        </Button>
        <Button
          size='lg'
          color='primary'
          className='flex-1'
          isLoading={isSaving}
          spinnerPlacement='end'
          disableRipple
          spinner={<Icon name='spinners-ring' className='size-5' />}
          onPress={handleSaveAllChanges}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}
