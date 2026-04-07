'use client'

import {selectClass} from '@/components/hero-v3/select'
import {Chip, Label, ListBox, Select as S} from '@heroui/react'
import {CategoryFormApi} from '../category-schema'
import {FormSection, Header} from './components'

const UNIT_SUGGESTIONS = [
  {key: 'g', label: 'g (grams)'},
  {key: 'oz', label: 'oz (ounces)'},
  {key: 'ml', label: 'ml (milliliters)'},
  {key: 'kg', label: 'kg (kilograms)'},
  {key: 'lb', label: 'lb (pounds)'},
  {key: 'each', label: 'each'},
  {key: 'piece', label: 'piece'},
  {key: 'pack', label: 'pack'},
  {key: 'unit', label: 'unit'},
]

// Map units to common denomination suggestions
const DENOMINATION_SUGGESTIONS: Record<string, number[]> = {
  g: [0.5, 1, 1.5, 2, 3, 4, 8], // Common cannabis flower weights in grams
  oz: [0.125, 0.25, 0.5, 1, 2, 4, 8], // Eighth, quarter, half, full ounce, etc.
  ml: [0.5, 1, 2, 5, 10, 30, 60, 100], // Common liquid volumes
  kg: [0.5, 1, 2, 5], // Kilogram weights
  lb: [0.25, 0.5, 1, 2, 5], // Pound weights
  each: [1, 2, 3, 5, 10], // Count-based
  piece: [1, 2, 3, 5, 10], // Count-based
  pack: [1, 2, 3, 5, 10], // Count-based
  unit: [1, 2, 3, 5, 10], // Count-based
}

interface PackagingProps {
  form: CategoryFormApi
}

export const Packaging = ({form}: PackagingProps) => {
  return (
    <FormSection id='packaging' position='middle'>
      <Header label='Packaging' />
      <div className='grid w-full grid-cols-1'>
        <div className='grid w-full gap-4 lg:grid-cols-2'>
          <form.AppField name='unitsRaw'>
            {(field) => {
              const unitsValue = (field.state.value as string) ?? ''
              const selectedUnits = new Set(
                unitsValue
                  .split(',')
                  .map((u) => u.trim())
                  .filter((u) => u.length > 0),
              )

              return (
                <div className='space-y-4 w-full'>
                  <S
                    selectionMode='multiple'
                    value={Array.from(selectedUnits)}
                    onChange={(keys) => {
                      field.handleChange(
                        (Array.isArray(keys) ? keys : []).map(String).join(', '),
                      )
                    }}
                    onBlur={field.handleBlur}
                    placeholder='Select units (e.g., g, oz, ml)'
                    className={selectClass.mainWrapper}>
                    <Label className={selectClass.label}>Packaging Units</Label>
                    <S.Trigger className={selectClass.trigger}>
                      <S.Value className={selectClass.value} />
                      <S.Indicator className={selectClass.selectIndicator} />
                    </S.Trigger>
                    <S.Popover className={selectClass.popover}>
                      <ListBox className={selectClass.listbox}>
                        {UNIT_SUGGESTIONS.map((unit) => (
                          <ListBox.Item
                            key={unit.key}
                            id={unit.key}
                            textValue={unit.label}
                            className={selectClass.listboxItem}>
                            {unit.label}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </S.Popover>
                  </S>

                  {selectedUnits.size > 0 && (
                    <div className='flex flex-wrap gap-2'>
                      {Array.from(selectedUnits).map((unit) => (
                        <Chip key={unit} size='sm' variant='secondary'>
                          {unit}
                        </Chip>
                      ))}
                    </div>
                  )}

                  <field.TextField
                    label='Custom Units'
                    type='text'
                    placeholder='Or type custom units separated by commas (e.g., dozen, case)'
                  />

                  {field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0 && (
                      <p className='text-xs text-rose-400'>
                        {field.state.meta.errors.join(', ')}
                      </p>
                    )}
                </div>
              )
            }}
          </form.AppField>

          <form.AppField name='denominationsRaw'>
            {(field) => {
              const denominationsValue = (field.state.value as string) ?? ''
              const selectedDenominations = new Set(
                denominationsValue
                  .split(/[,\n]/)
                  .map((d) => d.trim())
                  .filter((d) => d.length > 0),
              )

              // Get units from the form to determine suggestions
              const unitsValue = form.getFieldValue('unitsRaw') as
                | string
                | undefined
              const selectedUnits = (unitsValue ?? '')
                .split(',')
                .map((u) => u.trim())
                .filter((u) => u.length > 0)

              // Combine suggestions from all selected units, sorted numerically
              const getSuggestions = (): number[] => {
                const base =
                  selectedUnits.length === 0
                    ? DENOMINATION_SUGGESTIONS.g
                    : (() => {
                        const all = new Set<number>()
                        selectedUnits.forEach((unit) => {
                          DENOMINATION_SUGGESTIONS[unit.toLowerCase()]?.forEach(
                            (s) => all.add(s),
                          )
                        })
                        return all.size === 0
                          ? DENOMINATION_SUGGESTIONS.g
                          : Array.from(all)
                      })()
                return [...base].sort((a, b) => a - b)
              }

              const suggestions = getSuggestions()

              return (
                <div className='space-y-4 w-full'>
                  <S
                    selectionMode='multiple'
                    value={Array.from(selectedDenominations)}
                    onChange={(keys) => {
                      const sorted = (Array.isArray(keys) ? keys : [])
                        .map(String)
                        .sort((a, b) => Number(a) - Number(b))
                      field.handleChange(sorted.join(', '))
                    }}
                    onBlur={field.handleBlur}
                    placeholder='Select denominations'
                    className={selectClass.mainWrapper}>
                    <Label className={selectClass.label}>Denominations</Label>
                    <S.Trigger className={selectClass.trigger}>
                      <S.Value className={selectClass.value} />
                      <S.Indicator className={selectClass.selectIndicator} />
                    </S.Trigger>
                    <S.Popover className={selectClass.popover}>
                      <ListBox className={selectClass.listbox}>
                        {suggestions.map((s) => (
                          <ListBox.Item
                            key={String(s)}
                            id={String(s)}
                            textValue={String(s)}
                            className={selectClass.listboxItem}>
                            {s}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </S.Popover>
                  </S>

                  {field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0 && (
                      <p className='text-xs text-rose-400'>
                        {field.state.meta.errors.join(', ')}
                      </p>
                    )}
                </div>
              )
            }}
          </form.AppField>
        </div>
      </div>
    </FormSection>
  )
}
