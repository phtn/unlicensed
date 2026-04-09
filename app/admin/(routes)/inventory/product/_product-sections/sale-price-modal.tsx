'use client'

import {Input} from '@/components/hero-v3/input'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Modal} from '@heroui/react'
import {useState} from 'react'

export type SalePriceOption = {
  key: string
  label: string
  regularPrice: number
}

type SalePriceModalProps = {
  initialSalePrices: Record<string, number>
  isOpen: boolean
  onOpenChangeAction: (isOpen: boolean) => void
  onSaveAction: (nextSalePrices: Record<string, number>) => void
  options: SalePriceOption[]
}

const buildDraftPrices = (
  options: SalePriceOption[],
  initialSalePrices: Record<string, number>,
) =>
  Object.fromEntries(
    options.map((option) => [
      option.key,
      initialSalePrices[option.key] != null
        ? String(initialSalePrices[option.key])
        : '',
    ]),
  )

export function SalePriceModal({
  initialSalePrices,
  isOpen,
  onOpenChangeAction,
  onSaveAction,
  options,
}: SalePriceModalProps) {
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>(() =>
    buildDraftPrices(options, initialSalePrices),
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSave = () => {
    if (options.length === 0) {
      setErrorMessage(
        'No available denominations are selected. Select denominations first.',
      )
      return
    }

    const nextSalePrices: Record<string, number> = {}

    for (const option of options) {
      const rawValue = draftPrices[option.key]?.trim() ?? ''
      if (!rawValue) {
        setErrorMessage('Set a sale price for each available denomination.')
        return
      }

      const parsedValue = Number(rawValue)
      if (!Number.isFinite(parsedValue) || parsedValue < 0) {
        setErrorMessage(`${option.label} sale price must be 0 or greater.`)
        return
      }

      if (option.regularPrice > 0 && parsedValue > option.regularPrice) {
        setErrorMessage(
          `${option.label} sale price cannot exceed the regular price.`,
        )
        return
      }

      nextSalePrices[option.key] = parsedValue
    }

    onSaveAction(nextSalePrices)
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChangeAction}>
      <Modal.Backdrop variant='blur'>
        <Modal.Container placement='center'>
          <Modal.Dialog className='rounded-lg border border-sidebar'>
            <Modal.Header>
              <div>
                <div className='font-clash font-bold text-lg uppercase tracking-wider'>
                  Sale Prices
                </div>
                <span className='text-sm font-medium text-indigo-500 dark:text-indigo-500'>
                  Set sale pricing for each active denomination
                </span>
              </div>
            </Modal.Header>
            <Modal.Body className='space-y-4'>
              <p className='text-sm text-foreground opacity-60'>
                Sale prices apply per denomination. Regular prices stay intact,
                and the product remains sale-enabled until you turn off{' '}
                <span className='font-medium'>On Sale</span>.
              </p>

              {options.length === 0 ? (
                <p className='rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-foreground-600 dark:border-slate-800 dark:bg-slate-950/40'>
                  No available denominations are selected for this product.
                  Choose one or more denominations in Pricing or Inventory
                  first.
                </p>
              ) : (
                <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                  {options.map((option) => (
                    <div key={option.key} className='space-y-1.5'>
                      <Input
                        name={`sale-price-${option.key}`}
                        label={option.label}
                        type='number'
                        min={0}
                        step='0.01'
                        value={draftPrices[option.key] ?? ''}
                        onChange={(event) =>
                          setDraftPrices((current) => ({
                            ...current,
                            [option.key]: event.target.value,
                          }))
                        }
                        placeholder='0.00'
                      />
                      <p className='px-1 text-foreground text-sm opacity-80'>
                        Regular price: $
                        <span className='font-clash'>
                          {formatPrice(Math.round(option.regularPrice * 100))}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {errorMessage ? (
                <p className='text-sm text-rose-500'>{errorMessage}</p>
              ) : null}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant='tertiary'
                onPress={() => onOpenChangeAction(false)}>
                Cancel
              </Button>
              <Button
                variant='primary'
                isDisabled={options.length === 0}
                onPress={handleSave}
                className='bg-indigo-500 dark:bg-indigo-400'>
                Save Sale Prices
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
