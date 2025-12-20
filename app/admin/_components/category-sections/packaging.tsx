'use client'

import {cn} from '@/lib/utils'
import {Chip, Input, Select, SelectItem, Textarea} from '@heroui/react'
import {CategoryFormApi} from '../category-schema'
import {commonInputClassNames} from '../ui/fields'
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
      <div className='grid gap-6'>
        <div className='flex items-center space-x-6'>
          <form.AppField name='unitsRaw'>
            {(field) => {
              const unitsValue = (field.state.value as string) ?? ''
              const selectedUnits = unitsValue
                .split(',')
                .map((u) => u.trim())
                .filter((u) => u.length > 0)
              const selectedKeys = new Set(selectedUnits)

              return (
                <div className='space-y-2'>
                  <Select
                    label='Units'
                    selectionMode='multiple'
                    selectedKeys={selectedKeys}
                    onSelectionChange={(keys) => {
                      const selectedArray = Array.from(keys) as string[]
                      const newValue = selectedArray.join(', ')
                      field.handleChange(newValue)
                    }}
                    onBlur={field.handleBlur}
                    placeholder='Select units (e.g., g, oz, ml)'
                    variant='bordered'
                    isMultiline
                    classNames={{
                      ...commonInputClassNames,
                      value: 'placeholder:text-slate-400/80 py-2',
                      trigger:
                        'border h-14 border-light-gray/10 dark:border-black/20 bg-light-gray/10 shadow-none dark:bg-black/60 rounded-lg p-2 outline-none data-focus:border-blue-500 dark:data-hover:border-blue-500',
                      mainWrapper: 'py-4',
                    }}
                    renderValue={(items) => {
                      return (
                        <div className='flex flex-wrap gap-x-2'>
                          {items.map((item) => (
                            <span
                              key={item.key}
                              className='text-sm bg-blue-50 dark:bg-blue-100/10 text-blue-500 dark:text-blue-400 px-2 py-1 rounded tracking-tight font-medium'>
                              {item.textValue}
                            </span>
                          ))}
                        </div>
                      )
                    }}>
                    {UNIT_SUGGESTIONS.map((unit) => (
                      <SelectItem key={unit.key}>{unit.label}</SelectItem>
                    ))}
                  </Select>
                  <p className='text-xs opacity-80'>
                    Select multiple units from the suggestions. You can also
                    type custom units separated by commas in the input below.
                  </p>
                  <Input
                    size='sm'
                    value={unitsValue}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder='Or type custom units separated by commas (e.g., g, oz, ml)'
                    variant='bordered'
                    classNames={commonInputClassNames}
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
              const currentDenominations = denominationsValue
                .split(/[,\n]/)
                .map((d) => Number.parseFloat(d.trim()))
                .filter((d) => !Number.isNaN(d))

              // Get units from the form to determine suggestions
              const unitsValue = form.getFieldValue('unitsRaw') as
                | string
                | undefined
              const selectedUnits = (unitsValue ?? '')
                .split(',')
                .map((u) => u.trim())
                .filter((u) => u.length > 0)

              // Get denomination suggestions based on selected units
              const getSuggestions = () => {
                if (selectedUnits.length === 0) {
                  // Default suggestions if no units selected
                  return DENOMINATION_SUGGESTIONS.g
                }

                // Combine suggestions from all selected units, removing duplicates
                const allSuggestions = new Set<number>()
                selectedUnits.forEach((unit) => {
                  const unitSuggestions =
                    DENOMINATION_SUGGESTIONS[unit.toLowerCase()]
                  if (unitSuggestions) {
                    unitSuggestions.forEach((s) => allSuggestions.add(s))
                  }
                })

                // If no matches found, use default
                if (allSuggestions.size === 0) {
                  return DENOMINATION_SUGGESTIONS.g
                }

                return Array.from(allSuggestions).sort((a, b) => a - b)
              }

              const suggestions = getSuggestions()

              const handleSuggestionClick = (value: number) => {
                if (!currentDenominations.includes(value)) {
                  const newDenominations = [
                    ...currentDenominations,
                    value,
                  ].sort((a, b) => a - b)
                  const newValue = newDenominations.join(', ')
                  field.handleChange(newValue)
                }
              }

              return (
                <div className='space-y-2 w-full'>
                  <Textarea
                    label='Denominations'
                    value={denominationsValue}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder='Enter denominations separated by commas'
                    className='mb-6'
                    minRows={2}
                    variant='bordered'
                    classNames={commonInputClassNames}
                  />
                  {selectedUnits.length > 0 && suggestions.length > 0 && (
                    <div className='space-y-1 h-full'>
                      <p className='text-sm opacity-80'>
                        Click on suggested denominations for{' '}
                        <span className='font-semibold'>
                          {selectedUnits.map((u) => `"${u}"`).join(', ')}
                        </span>
                        :
                      </p>
                      <div className='flex flex-wrap gap-1 md:gap-3 font-space font-semibold'>
                        {suggestions.map((suggestion) => {
                          const isSelected =
                            currentDenominations.includes(suggestion)
                          return (
                            <Chip
                              key={suggestion}
                              size='sm'
                              variant={isSelected ? 'light' : 'solid'}
                              className={cn(
                                'cursor-pointer transition-all text-white',
                                {'': isSelected},
                              )}
                              onClick={() => handleSuggestionClick(suggestion)}>
                              {suggestion}
                            </Chip>
                          )
                        })}
                      </div>
                      {/*<p className='text-xs text-neutral-500'>
                        Click a suggestion to add it, or type custom values
                        separated by commas or newlines.
                      </p>*/}
                    </div>
                  )}
                  {selectedUnits.length === 0 && (
                    <p className='text-sm opacity-50'>
                      Select units above to see denomination suggestions, or
                      enter numeric values separated by commas or newlines
                      (e.g., 1, 3.5, 7, 14, 28)
                    </p>
                  )}
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
