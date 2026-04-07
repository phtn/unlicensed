'use client'

import type {CategoryType} from '@/convex/categories/d'
import {Icon} from '@/lib/icons'
import {slugify} from '@/lib/slug'
import {Accordion, Button, Input} from '@heroui/react'
import {useMemo, useState} from 'react'
import type {
  AttributeEntry as CategoryAttributeEntry,
  CategoryFormApi,
} from '../category-schema'
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
        const count = ((field.state.value as CategoryAttributeEntry[]) ?? [])
          .length

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
        const entries = (field.state.value as CategoryAttributeEntry[]) ?? []

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
        //   patch: Partial<CategoryAttributeEntry>,
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
            <div className='flex flex-col sm:flex-row gap-4'>
              <Input
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
                variant='secondary'
                className='flex-1 text-foreground shadow-none placeholder:text-foreground/60'
              />
              <Input
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
                variant='secondary'
                className='flex-1 text-foreground shadow-none placeholder:text-foreground/60'
              />
              <Button
                size='sm'
                variant='primary'
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
                    className='flex flex-wrap items-center gap-2 text-foreground rounded-lg bg-dark-gray/10 dark:bg-white/10 px-3 py-1 w-fit'>
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

interface AttributeDefinition {
  name: AttributeFieldName
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
      ] as Array<AttributeDefinition>,
    [],
  )
  return (
    <FormSection id='attributes' position='middle'>
      <Header label='Attributes' />
      <Accordion
        variant='surface'
        className='rounded-lg overflow-hidden border border-gray-300 bg-sidebar/50 px-0 dark:border-origin'>
        {attributes.map((attribute) => (
          <Accordion.Item
            key={attribute.name}
            id={attribute.name}
            className='overflow-hidden py-0 data-[expanded=true]:bg-white dark:data-[expanded=true]:bg-sidebar'>
            <Accordion.Heading>
              <Accordion.Trigger className='rounded-none px-4 py-3 font-medium tracking-tight'>
                <AttributeAccordionTitle
                  form={form}
                  fieldName={attribute.name}
                  title={attribute.label}
                />
                <Accordion.Indicator />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body className='px-4 pb-4 pt-0'>
                <AttributeEntryListField
                  form={form}
                  fieldName={attribute.name}
                  emptyLabel={attribute.emptyLabel}
                />
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </FormSection>
  )
}
