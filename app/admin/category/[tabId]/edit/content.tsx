'use client'

import {CategoryForm} from '@/app/admin/category/category-form'
import {api} from '@/convex/_generated/api'
import {CategoryFormValues} from '@/app/admin/_components/category-schema'
import {useQuery} from 'convex/react'
import {useRouter} from 'next/navigation'

interface EditCategoryContentProps {
  categorySlug: string
}

export const EditCategoryContent = ({
  categorySlug,
}: EditCategoryContentProps) => {
  const router = useRouter()
  const category = useQuery(api.categories.q.getCategoryBySlug, {
    slug: categorySlug,
  })

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
    name: category.name,
    slug: category.slug,
    description: category.description,
    heroImage: category.heroImage,
    visible: category.visible ?? false,
    highlight: category.highlight ?? '',
    benefitsRaw: category.benefits?.join('\n') ?? '',
    unitsRaw: category.units?.join(', ') ?? '',
    denominationsRaw: category.denominations?.join(', ') ?? '',
  }

  const handleUpdated = () => {
    // Navigate back to the category page after successful update
    router.push(`/admin/category/${categorySlug}`)
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
