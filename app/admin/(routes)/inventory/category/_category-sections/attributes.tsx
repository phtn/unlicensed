'use client'

import type {AttributeEntry} from '@/app/admin/(routes)/inventory/category/category-schema'
import type {CategoryType} from '@/convex/categories/d'
import {Icon} from '@/lib/icons'
import {slugify} from '@/lib/slug'
import {Accordion, AccordionItem, Button, Input} from '@heroui/react'
import {useState} from 'react'
import {narrowInputClassNames} from '../../../../_components/ui/fields'
import type {CategoryFormApi} from '../category-schema'
import {FormSection, Header} from './components'

type AttributeFieldName =
  | 'tiers'
  | 'productTypes'
  | 'subcategories'
  | 'bases'
  | 'brands'

interface AttributeEntryListFieldProps {
  form: CategoryFormApi
  fieldName: AttributeFieldName
  namePlaceholder?: string
  slugPlaceholder?: string
  emptyLabel: string
}

function AttributeEntryListField({
  form,
  fieldName,
  namePlaceholder,
  slugPlaceholder,
  emptyLabel,
}: AttributeEntryListFieldProps) {
  const [nameInput, setNameInput] = useState('')
  const [slugInput, setSlugInput] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  return (
    <form.AppField name={fieldName}>
      {(field) => {
        const entries = (field.state.value as AttributeEntry[]) ?? []

        const handleAdd = () => {
          const name = nameInput.trim()
          if (!name) return
          const slug =
            slugInput.trim() ||
            slugify(name) ||
            name.toLowerCase().replace(/\s+/g, '-')
          const next = [...entries, {name, slug}]
          field.handleChange(next)
          setNameInput('')
          setSlugInput('')
          setSlugManuallyEdited(false)
        }

        const handleRemove = (index: number) => {
          const next = entries.filter((_, i) => i !== index)
          field.handleChange(next)
        }

        // const _handleUpdate = (
        //   index: number,
        //   patch: Partial<AttributeEntry>,
        // ) => {
        //   const next = entries.map((e, i) =>
        //     i === index ? {...e, ...patch} : e,
        //   )
        //   field.handleChange(next)
        // }

        const handleNameChange = (value: string) => {
          setNameInput(value)
          if (!slugManuallyEdited) {
            setSlugInput(slugify(value))
          }
        }

        return (
          <div className='space-y-3'>
            <div className='flex flex-col sm:flex-row gap-2'>
              <Input
                size='sm'
                value={nameInput}
                onChange={(e) => handleNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.stopPropagation()
                    handleAdd()
                  }
                }}
                placeholder={namePlaceholder ?? 'Name'}
                variant='bordered'
                classNames={narrowInputClassNames}
                className='flex-1'
              />
              <Input
                size='sm'
                value={slugInput}
                onChange={(e) => {
                  setSlugInput(e.target.value)
                  setSlugManuallyEdited(true)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.stopPropagation()
                    handleAdd()
                  }
                }}
                placeholder={slugPlaceholder ?? 'Slug'}
                variant='bordered'
                classNames={narrowInputClassNames}
                className='flex-1'
              />
              <Button
                size='sm'
                radius='none'
                variant='solid'
                color='primary'
                className='rounded-sm dark:bg-white dark:text-dark-table shrink-0'
                onPress={handleAdd}
                isDisabled={!nameInput.trim()}>
                Add
              </Button>
            </div>
            {entries.length > 0 ? (
              <ul className='flex flex-wrap space-x-2'>
                {entries.map((entry, index) => (
                  <li
                    key={`${entry.slug}-${index}`}
                    className='flex flex-wrap items-center gap-2 rounded-lg bg-dark-gray/10 dark:bg-dark-table px-3 py-1 w-fit'>
                    <span>{entry.name}</span>
                    <button
                      type='button'
                      onClick={() => handleRemove(index)}
                      className='rounded p-1.5 text-muted-foreground hover:bg-dark-gray/20 hover:text-rose-500 dark:hover:bg-sidebar'
                      aria-label={`Remove ${entry.name}`}>
                      <Icon name='x' className='size-4' />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className='text-sm text-dark-gray/60 dark:text-light-gray/60'>
                {emptyLabel}
              </p>
            )}
          </div>
        )
      }}
    </form.AppField>
  )
}

interface AttributesProps {
  form: CategoryFormApi
  category: CategoryType | null
}

export const Attributes = ({form, category: _category}: AttributesProps) => {
  return (
    <FormSection id='attributes' position='middle'>
      <Header label='Attributes' />
      <Accordion
        variant='bordered'
        className='rounded-lg border border-gray-300 dark:border-origin px-0'
        itemClasses={{
          base: 'py-0 bg-sidebar',
          title: 'font-medium tracking-tight',
          trigger: 'py-3 px-4',
          content: 'pb-4 pt-0 px-4',
        }}>
        <AccordionItem key='tiers' aria-label='tiers' title='Tiers'>
          <AttributeEntryListField
            form={form}
            fieldName='tiers'
            namePlaceholder='Name'
            slugPlaceholder='Slug'
            emptyLabel='No tiers set for this category'
          />
        </AccordionItem>
        <AccordionItem key='types' aria-label='types' title='Types'>
          <AttributeEntryListField
            form={form}
            fieldName='productTypes'
            namePlaceholder='e.g. Disposable, Cartridge, Pod'
            slugPlaceholder='e.g. disposable, cartridge (auto from name)'
            emptyLabel='No product types configured'
          />
        </AccordionItem>
        <AccordionItem key='base' aria-label='base' title='Base'>
          <AttributeEntryListField
            form={form}
            fieldName='bases'
            namePlaceholder='e.g. Flower, Infused, Distillate'
            slugPlaceholder='e.g. flower, infused (auto from name)'
            emptyLabel='No base options configured'
          />
        </AccordionItem>
        <AccordionItem
          key='subcategory'
          aria-label='subcategory'
          title='Subcategory'>
          <AttributeEntryListField
            form={form}
            fieldName='subcategories'
            namePlaceholder='e.g. Sativa, Hybrid, Indica'
            slugPlaceholder='e.g. sativa, hybrid (auto from name)'
            emptyLabel='No subcategories configured'
          />
        </AccordionItem>
        <AccordionItem key='brand' aria-label='brand' title='Brand'>
          <AttributeEntryListField
            form={form}
            fieldName='brands'
            namePlaceholder='e.g. Brand A, House Brand'
            slugPlaceholder='e.g. brand-a (auto from name)'
            emptyLabel='No brands configured'
          />
        </AccordionItem>
      </Accordion>
    </FormSection>
  )
}
