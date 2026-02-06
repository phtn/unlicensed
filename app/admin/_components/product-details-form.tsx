'use client'

import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {getTotalStock} from '@/lib/productStock'
import {Button, Image, Input, Switch, Textarea} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
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
  const productImageUrl = useQuery(
    api.products.q.getPrimaryImage,
    product.image ? {id: product._id} : 'skip',
  )

  const [name, setName] = useState(product.name)
  const [priceCents, setPriceCents] = useState(product.priceCents)
  const [stock, setStock] = useState(getTotalStock(product))
  const [unit, setUnit] = useState(product.unit)
  const [available, setAvailable] = useState(product.available)
  const [featured, setFeatured] = useState(product.featured)
  const [isSaving, setIsSaving] = useState(false)

  // Sync form state when product changes
  useEffect(() => {
    setName(product.name)
    setPriceCents(product.priceCents)
    setStock(getTotalStock(product))
    setUnit(product.unit)
    setAvailable(product.available)
    setFeatured(product.featured)
  }, [
    product._id,
    product.name,
    product.priceCents,
    product.stock,
    product.stockByDenomination,
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
        name?: string
        priceCents?: number
        stock?: number
        unit?: string
      } = {}

      // Only include fields that have changed
      if (name !== product.name) {
        fields.name = name
      }
      if (priceCents !== product.priceCents) {
        fields.priceCents = priceCents
      }
      if (stock !== getTotalStock(product)) {
        fields.stock = stock
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
      setName(product.name)
      setPriceCents(product.priceCents)
      setStock(getTotalStock(product))
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
        <Image
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
          <Textarea
            value={product.description}
            readOnly
            size='sm'
            minRows={3}
            className='text-xs bg-transparent! dark:bg-transparent!'
          />
        </div>
      )}
      {/* Price */}

      <div className='grid grid-cols-3 items-center gap-x-4'>
        <div className='w-full'>
          <Input
            label='Price'
            size='md'
            type='number'
            value={String(priceCents)}
            onValueChange={(value) => setPriceCents(Number(value))}
            placeholder='Price in cents'
          />
        </div>
        <div>
          <div className='w-full'>
            <Input
              label='Unit'
              size='md'
              value={unit}
              onValueChange={(value) => setUnit(value)}
              placeholder='Unit'
            />
          </div>
        </div>
        <div className='w-full'>
          <Input
            label='Qty in stock'
            size='md'
            type='number'
            value={String(stock)}
            onValueChange={(value) => setStock(Number(value))}
            placeholder='Stock quantity'
          />
        </div>
      </div>

      {/* Status */}
      <div className='flex gap-3'>
        <div className='flex justify-between w-full gap-5'>
          <div className='flex items-center justify-between w-full border border-emerald-400 bg-emerald-200/5 rounded p-3'>
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
          <div className='flex items-center justify-between w-full border border-featured bg-featured/5 rounded p-3'>
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
              classNames={{wrapper: 'bg-featured'}}
              className=''
              size='sm'
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className='flex gap-4 pt-2'>
        <Button size='lg' className='flex-1' onPress={handleCancel}>
          Cancel
        </Button>
        <Button
          size='lg'
          className='flex-1 bg-featured'
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
