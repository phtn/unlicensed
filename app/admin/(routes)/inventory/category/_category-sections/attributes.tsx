'use client'

import type {CategoryType} from '@/convex/categories/d'
import {Icon} from '@/lib/icons'
import {slugify} from '@/lib/slug'
import {Accordion, AccordionItem, Button, Input} from '@heroui/react'
import {useMemo, useState} from 'react'
import {narrowInputClassNames} from '../../../../_components/ui/fields'
import type {CategoryFormApi} from '../category-schema'
import {FormSection, Header} from './components'

type AttributeFieldName =
  | 'tiers'
  | 'strainTypes'
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

interface AttributeAccordionTitleProps {
  form: CategoryFormApi
  fieldName: AttributeFieldName
  title: string
}

function AttributeAccordionTitle({
  form,
  fieldName,
  title,
}: AttributeAccordionTitleProps) {
  return (
    <form.AppField name={fieldName}>
      {(field) => {
        const count = ((field.state.value as AttributeEntry[]) ?? []).length

        return (
          <div className='flex w-full items-center justify-between gap-3'>
            <div className='flex items-center space-x-2'>
              <span>{title}</span>
              <span className='inline-flex min-w-7 items-center justify-center rounded-xs px-2 py-0.5 text-sm md:text-base font-medium text-dark-gray/80 dark:text-light-gray/80'>
                {count}
              </span>
            </div>
          </div>
        )
      }}
    </form.AppField>
  )
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
                size='md'
                radius='none'
                variant='solid'
                color='primary'
                className='rounded-xs bg-dark-table dark:bg-white dark:text-dark-table shrink-0'
                onPress={handleAdd}
                isDisabled={!nameInput.trim()}>
                Add
              </Button>
            </div>
            {entries.length > 0 ? (
              <ul className='flex flex-wrap space-x-2 gap-y-2'>
                {entries.map((entry, index) => (
                  <li
                    key={`${entry.slug}-${index}`}
                    className='flex flex-wrap items-center gap-2 rounded-lg bg-dark-gray/10 dark:bg-white/10 px-3 py-1 w-fit'>
                    <span className='ps-1'>{entry.name}</span>
                    <button
                      type='button'
                      onClick={() => handleRemove(index)}
                      className='rounded ml-1 text-muted-foreground  hover:text-rose-500 dark:hover:text-rose-400'
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

interface AttributeEntry {
  name: AttributeFieldName
  slug: string
  label: string
  emptyLabel: string
}

interface AttributesProps {
  form: CategoryFormApi
  category: CategoryType | null
}

export const Attributes = ({form, category: _category}: AttributesProps) => {
  const attributes = useMemo(
    () =>
      [
        {
          name: 'tiers',
          label: 'Tiers',
          emptyLabel: 'No tiers set for this category',
        },
        {
          name: 'strainTypes',
          label: 'Strain Types',
          emptyLabel: 'No strain types configured',
        },
        {
          name: 'bases',
          label: 'Base',
          emptyLabel: 'No base options configured',
        },
        {
          name: 'subcategories',
          label: 'Subcategory',
          emptyLabel: 'No subcategories configured',
        },
        {
          name: 'brands',
          label: 'Brand',
          emptyLabel: 'No brands configured',
        },
      ] as Array<AttributeEntry>,
    [],
  )
  return (
    <FormSection id='attributes' position='middle'>
      <Header label='Attributes' />
      <Accordion
        variant='bordered'
        className='rounded-lg bg-sidebar/50 border border-gray-300 dark:border-origin px-0'
        itemClasses={{
          base: 'py-0 overflow-hidden',
          title: 'font-medium tracking-tight',
          trigger: 'py-3 px-4',
          content: 'pb-4 pt-0 px-4',
          titleWrapper: '',
        }}>
        {attributes.map((attribute) => (
          <AccordionItem
            key={attribute.name}
            aria-label={attribute.name}
            title={
              <AttributeAccordionTitle
                form={form}
                fieldName={attribute.name}
                title={attribute.label}
              />
            }
            className='dark:data-open:bg-sidebar data-open:bg-white rounded-t-lg'>
            <AttributeEntryListField
              form={form}
              fieldName={attribute.name}
              emptyLabel={attribute.emptyLabel}
            />
          </AccordionItem>
        ))}
      </Accordion>
    </FormSection>
  )
}
