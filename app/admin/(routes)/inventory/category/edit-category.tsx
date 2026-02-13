'use client'

import {CategoryForm} from '@/app/admin/(routes)/inventory/category/category-form'
import {CategoryFormValues} from '@/app/admin/_components/category-schema'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useQuery} from 'convex/react'
import {useRouter} from 'next/navigation'

interface EditCategoryContentProps {
  id: Id<'categories'>
}

export const EditCategory = ({id}: EditCategoryContentProps) => {
  const router = useRouter()
  // const category = useQuery(api.categories.q.getCategoryBySlug, {
  //   slug: categorySlug,
  // })
  console.log(id)
  const category = useQuery(
    api.categories.q.getCategoryById,
    id ? {id} : 'skip',
  )

  if (category === undefined) {
    return (
      <div className='flex items-center justify-center h-[calc(100vh-6rem)]'>
        <p className='text-neutral-500'>Loading category...</p>
      </div>
    )
  }

  if (category === null) {
    return (
      <div className='flex items-center justify-center h-[calc(100vh-6rem)]'>
        <p className='text-neutral-500'>Category not found</p>
      </div>
    )
  }

  // Convert category data to form values
  const initialValues: CategoryFormValues = {
    name: category.name ?? '',
    slug: category.slug ?? '',
    description: category.description ?? '',
    heroImage: category.heroImage ?? '',
    visible: category.visible ?? false,
    highlight: category.highlight ?? '',
    benefitsRaw: category.benefits?.join('\n') ?? '',
    unitsRaw: category.units?.join(', ') ?? '',
    productTypesRaw: category.productTypes?.join(', ') ?? '',
    denominationsRaw: category.denominations?.join(', ') ?? '',
  }

  const handleUpdated = () => {
    // Navigate back to the category page after successful update
    router.push(`/admin/inventory/category/${category.slug}`)
  }

  return (
    <CategoryForm
      key={category._id}
      categoryId={category._id}
      initialValues={initialValues}
      onUpdated={handleUpdated}
    />
  )
}
