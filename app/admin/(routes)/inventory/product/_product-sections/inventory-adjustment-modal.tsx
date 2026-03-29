'use client'

import {narrowInputClassNames} from '@/app/admin/_components/ui/fields'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {useFirebaseAuthUser} from '@/hooks/use-firebase-auth-user'
import {normalizeInventoryMode} from '@/lib/productStock'
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from '@heroui/react'
import {useMutation} from 'convex/react'
import {useEffect, useMemo, useState} from 'react'
import {mapNumericFractions} from '../product-schema'

type Product = Doc<'products'>
type AdjustmentType = 'restock' | 'manual_override'

export type InventoryInput = {
  currentQuantity: number
  denomination?: number
  key: string
  label: string
  unit?: string
}

export const formatQuantity = (value: number) =>
  Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)))

const formatDenominationLabel = (
  denomination: number,
  unit: string | undefined,
) => {
  const label =
    mapNumericFractions[String(denomination)] ?? String(denomination)
  return unit ? `${label} ${unit}` : label
}

export const buildInventoryInputs = (product: Product): InventoryInput[] => {
  const inventoryMode = normalizeInventoryMode(product.inventoryMode)

  if (inventoryMode === 'shared') {
    return [
      {
        key: 'default',
        label: 'Master stock',
        currentQuantity: product.masterStockQuantity ?? 0,
        unit: product.masterStockUnit ?? product.unit ?? undefined,
      },
    ]
  }

  const stockByDenomination = product.stockByDenomination ?? {}
  const denominationKeys = new Set<string>()

  for (const denomination of product.availableDenominations ?? []) {
    denominationKeys.add(String(denomination))
  }

  for (const denominationKey of Object.keys(stockByDenomination)) {
    denominationKeys.add(denominationKey)
  }

  if (denominationKeys.size === 0) {
    return [
      {
        key: 'default',
        label: 'Stock',
        currentQuantity: product.stock ?? 0,
        unit: product.unit ?? undefined,
      },
    ]
  }

  return [...denominationKeys]
    .map((key) => ({
      key,
      denomination: Number(key),
      currentQuantity: stockByDenomination[key] ?? 0,
      label: formatDenominationLabel(Number(key), product.unit ?? undefined),
      unit: product.unit ?? undefined,
    }))
    .sort((a, b) => {
      if (a.denomination == null) return -1
      if (b.denomination == null) return 1
      return a.denomination - b.denomination
    })
}

type InventoryAdjustmentModalProps = {
  adjustmentType: AdjustmentType
  isOpen: boolean
  onOpenChangeAction: (isOpen: boolean) => void
  product: Product
}

export function InventoryAdjustmentModal({
  adjustmentType,
  isOpen,
  onOpenChangeAction,
  product,
}: InventoryAdjustmentModalProps) {
  const {user} = useFirebaseAuthUser()
  const applyInventoryAdjustment = useMutation(
    api.inventoryMovements.m.applyInventoryAdjustment,
  )
  const inventoryInputs = useMemo(
    () => buildInventoryInputs(product),
    [product],
  )
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [note, setNote] = useState('')
  const [reference, setReference] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setQuantities({})
      setNote('')
      setReference('')
      setErrorMessage(null)
      setIsSubmitting(false)
      return
    }

    setQuantities(
      Object.fromEntries(inventoryInputs.map((input) => [input.key, ''])),
    )
    setNote('')
    setReference('')
    setErrorMessage(null)
  }, [inventoryInputs, isOpen, adjustmentType])

  const submitLabel =
    adjustmentType === 'restock' ? 'Record Restock' : 'Apply Override'

  const description =
    adjustmentType === 'restock'
      ? 'Add newly received supply to the current on-hand inventory. Only the fields you fill will be updated.'
      : 'Set exact on-hand quantities for corrections. Leave a field blank to keep its current quantity.'

  const handleSubmit = async () => {
    setErrorMessage(null)

    try {
      const adjustments = inventoryInputs.flatMap((input) => {
        const rawValue = quantities[input.key]?.trim() ?? ''
        if (rawValue.length === 0) return []

        const quantity = Number(rawValue)
        if (!Number.isFinite(quantity)) {
          throw new Error(`${input.label} must be a valid number.`)
        }

        if (adjustmentType === 'restock' && quantity <= 0) {
          throw new Error(`${input.label} must be greater than 0.`)
        }

        if (adjustmentType === 'manual_override' && quantity < 0) {
          throw new Error(`${input.label} must be 0 or greater.`)
        }

        return [
          {
            denomination: input.denomination,
            quantity,
          },
        ]
      })

      if (adjustments.length === 0) {
        throw new Error(
          adjustmentType === 'restock'
            ? 'Enter at least one quantity to restock.'
            : 'Enter at least one quantity to override.',
        )
      }

      setIsSubmitting(true)

      await applyInventoryAdjustment({
        productId: product._id,
        type: adjustmentType,
        adjustments,
        note: note.trim() || undefined,
        reference: reference.trim() || undefined,
        performedByEmail: user?.email ?? undefined,
        performedByName:
          user?.displayName ?? user?.email?.split('@')[0] ?? undefined,
      })

      onOpenChangeAction(false)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to update inventory.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChangeAction}
      placement='center'
      backdrop='blur'>
      <ModalContent className='rounded-lg border border-slate-400'>
        <ModalHeader>
          <div>
            <div className='font-bold uppercase'>
              {adjustmentType === 'restock' ? 'Restock' : 'Manual Override'}
            </div>
            <span className='dark:text-light-brand text-light-brand font-medium text-sm'>
              {product.name}
            </span>
          </div>
        </ModalHeader>
        <ModalBody className='space-y-4'>
          <p className='text-sm text-foreground-600'>{description}</p>

          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            {inventoryInputs.map((input) => (
              <Input
                key={input.key}
                label={input.label}
                type='number'
                min={0}
                step='0.001'
                value={quantities[input.key] ?? ''}
                classNames={narrowInputClassNames}
                onChange={(event) =>
                  setQuantities((current) => ({
                    ...current,
                    [input.key]: event.target.value,
                  }))
                }
                description={`Current: ${formatQuantity(input.currentQuantity)}${input.unit ? ` ${input.unit}` : ''}`}
                placeholder={
                  adjustmentType === 'restock'
                    ? '0'
                    : formatQuantity(input.currentQuantity)
                }
                variant='bordered'
              />
            ))}
          </div>

          <Input
            label='Reference'
            value={reference}
            onValueChange={setReference}
            placeholder='PO number, delivery note, or supplier reference'
            classNames={narrowInputClassNames}
            variant='bordered'
          />

          <Textarea
            label='Notes'
            value={note}
            onValueChange={setNote}
            placeholder='Optional context for this inventory change'
            classNames={narrowInputClassNames}
            variant='bordered'
            minRows={3}
          />

          {errorMessage ? (
            <p className='text-sm text-rose-500'>{errorMessage}</p>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button
            variant='light'
            onPress={() => onOpenChangeAction(false)}
            isDisabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            color='primary'
            isLoading={isSubmitting}
            onPress={handleSubmit}>
            {submitLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
