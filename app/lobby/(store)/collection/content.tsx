import {StoreProduct} from '@/app/types'
import {FireCollection} from '@/components/store/fire-collection'

interface StoreCollectionSection {
  id: string
  title: string
  products: StoreProduct[]
  sourceCategorySlug?: string
  sourceCategoryProductCount?: number
}

export const FireCollectionContent = ({
  initialCollections,
}: {
  initialCollections: StoreCollectionSection[]
}) => {
  return (
    <div className='min-h-screen pt-16 sm:pt-20 md:pt-24 lg:pt-28 xl:pt-28 pb-16 sm:pb-20 lg:pb-24 px-4 sm:px-6 overflow-x-hidden bg-background'>
      {/* Hero Section - Asymmetric Layout */}
      <section className='relative'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex flex-col gap-16'>
            {initialCollections.map((collection) => (
              <FireCollection
                key={collection.id}
                id={collection.id}
                title={collection.title}
                products={collection.products}
                sourceCategorySlug={collection.sourceCategorySlug}
                productCount={collection.sourceCategoryProductCount}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export const Content = FireCollectionContent
