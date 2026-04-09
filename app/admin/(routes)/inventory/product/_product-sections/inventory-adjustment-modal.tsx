'use client'

import {getSingleSelectedKey} from '@/app/admin/_components/ui/fields'
import {Input} from '@/components/hero-v3/input'
import {Select} from '@/components/hero-v3/select'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import type {InventoryMode} from '@/convex/products/d'
import {useFirebaseAuthUser} from '@/hooks/use-firebase-auth-user'
import {normalizeInventoryMode} from '@/lib/productStock'
import {Button, Modal, TextArea} from '@heroui/react'
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

type BuildInventoryInputsOptions = {
  availableDenominations?: number[]
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

const buildPerDenominationInputs = (
  denominationKeys: string[],
  stockByDenomination: Record<string, number>,
  unit: string | undefined,
): InventoryInput[] =>
  denominationKeys
    .map((key) => ({
      key,
      denomination: Number(key),
      currentQuantity: stockByDenomination[key] ?? 0,
      label: formatDenominationLabel(Number(key), unit),
      unit,
    }))
    .sort((a, b) => {
      if (a.denomination == null) return -1
      if (b.denomination == null) return 1
      return a.denomination - b.denomination
    })

export const buildInventoryInputs = (
  product: Product,
  inventoryMode: InventoryMode = normalizeInventoryMode(product.inventoryMode),
  options: BuildInventoryInputsOptions = {},
): InventoryInput[] => {
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
  const unit = product.unit ?? undefined
  const selectedAvailableDenominations = options.availableDenominations

  if (selectedAvailableDenominations) {
    const denominationKeys = [
      ...new Set(
        selectedAvailableDenominations
          .filter((value) => Number.isFinite(value))
          .map(String),
      ),
    ]

    return buildPerDenominationInputs(denominationKeys, stockByDenomination, unit)
  }

  const configuredDenominationKeys = [
    ...new Set(
      (product.availableDenominations ?? [])
        .filter((value) => Number.isFinite(value))
        .map(String),
    ),
  ]

  if (configuredDenominationKeys.length > 0) {
    return buildPerDenominationInputs(
      configuredDenominationKeys,
      stockByDenomination,
      unit,
    )
  }

  const stockedDenominationKeys = Object.keys(stockByDenomination)
  if (stockedDenominationKeys.length === 0) {
    return [
      {
        key: 'default',
        label: 'Stock',
        currentQuantity: product.stock ?? 0,
        unit,
      },
    ]
  }

  return buildPerDenominationInputs(stockedDenominationKeys, stockByDenomination, unit)
}

type InventoryAdjustmentModalProps = {
  adjustmentType: AdjustmentType
  availableDenominations?: number[]
  isOpen: boolean
  onOpenChangeAction: (isOpen: boolean) => void
  onAppliedAction?: (nextInventoryState: {
    inventoryMode: InventoryMode
    masterStockQuantity?: number
    masterStockUnit?: string
    stock: number
    stockByDenomination: Record<string, number>
  }) => void
  product: Product
}

export function InventoryAdjustmentModal({
  adjustmentType,
  availableDenominations,
  isOpen,
  onOpenChangeAction,
  onAppliedAction,
  product,
}: InventoryAdjustmentModalProps) {
  const {user} = useFirebaseAuthUser()
  const applyInventoryAdjustment = useMutation(
    api.inventoryMovements.m.applyInventoryAdjustment,
  )
  const initialInventoryMode = useMemo<InventoryMode>(
    () => normalizeInventoryMode(product.inventoryMode),
    [product.inventoryMode],
  )
  const [inventoryMode, setInventoryMode] =
    useState<InventoryMode>(initialInventoryMode)
  const inventoryInputs = useMemo(
    () =>
      buildInventoryInputs(product, inventoryMode, {
        availableDenominations,
      }),
    [availableDenominations, inventoryMode, product],
  )
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [note, setNote] = useState('')
  const [reference, setReference] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setInventoryMode(initialInventoryMode)
      setQuantities({})
      setNote('')
      setReference('')
      setErrorMessage(null)
      setIsSubmitting(false)
      return
    }

    setInventoryMode(initialInventoryMode)
    setNote('')
    setReference('')
    setErrorMessage(null)
    setIsSubmitting(false)
  }, [adjustmentType, initialInventoryMode, isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setQuantities(
      Object.fromEntries(inventoryInputs.map((input) => [input.key, ''])),
    )
    setErrorMessage(null)
  }, [inventoryInputs, isOpen])

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

      const result = await applyInventoryAdjustment({
        productId: product._id,
        type: adjustmentType,
        inventoryMode,
        adjustments,
        note: note.trim() || undefined,
        reference: reference.trim() || undefined,
        performedByEmail: user?.email ?? undefined,
        performedByName:
          user?.displayName ?? user?.email?.split('@')[0] ?? undefined,
      })

      onAppliedAction?.(result.nextInventoryState)
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
    <Modal isOpen={isOpen} onOpenChange={onOpenChangeAction}>
      <Modal.Backdrop variant='blur'>
        <Modal.Container placement='center'>
          <Modal.Dialog className='rounded-lg border border-slate-400'>
            <Modal.Header>
              <div>
                <div className='font-bold uppercase'>
                  {adjustmentType === 'restock' ? 'Restock' : 'Manual Override'}
                </div>
                <span className='dark:text-light-brand text-light-brand font-medium text-sm'>
                  {product.name}
                </span>
              </div>
            </Modal.Header>
            <Modal.Body className='space-y-4'>
              <p className='text-sm text-foreground-600'>{description}</p>

              <div className='space-y-2'>
                <Select
                  label='Inventory Mode'
                  value={String([inventoryMode])}
                  onChange={(keys) => {
                    const selected = getSingleSelectedKey(keys)
                    if (
                      selected === 'by_denomination' ||
                      selected === 'shared'
                    ) {
                      setInventoryMode(selected)
                    }
                  }}
                  isDisabled={isSubmitting}
                  options={[
                    {value: 'by_denomination', label: 'By denomination'},
                    {value: 'shared', label: 'Shared'},
                  ]}
                />
                <p className='text-xs text-foreground-500'>
                  Switching modes here updates the product inventory mode when
                  this adjustment is submitted. Stock values are not
                  auto-converted between modes, so enter the quantities you want
                  to track for the selected structure.
                </p>
              </div>

              {inventoryMode === 'by_denomination' &&
              inventoryInputs.length === 0 ? (
                <p className='rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-foreground-600 dark:border-slate-800 dark:bg-slate-950/40'>
                  No available denominations are selected for this product.
                  Choose one or more denominations in the Inventory section
                  first, then record the adjustment.
                </p>
              ) : (
                <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                  {inventoryInputs.map((input) => (
                    <Input
                      key={input.key}
                      label={input.label}
                      type='number'
                      min={0}
                      step='0.001'
                      value={quantities[input.key] ?? ''}
                      onChange={(event) =>
                        setQuantities((current) => ({
                          ...current,
                          [input.key]: event.target.value,
                        }))
                      }
                      placeholder={
                        adjustmentType === 'restock'
                          ? '0'
                          : formatQuantity(input.currentQuantity)
                      }
                    />
                  ))}
                </div>
              )}

              <Input
                label='Reference'
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder='PO number, delivery note, or supplier reference'
              />

              <TextArea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder='Optional context for this inventory change'
                rows={3}
              />

              {errorMessage ? (
                <p className='text-sm text-rose-500'>{errorMessage}</p>
              ) : null}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant='tertiary'
                onPress={() => onOpenChangeAction(false)}
                isDisabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant='primary'
                isPending={isSubmitting}
                onPress={handleSubmit}>
                {submitLabel}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
