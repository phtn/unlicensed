import {StoreProduct} from '@/app/types'
import {ProductProfile} from '@/components/ui/product-profile'

interface ProductDetailsProps {
  product: StoreProduct
}

interface ProfileGroupProps {
  title: string
  items: string[]
  group: 'effects' | 'flavors' | 'terpenes'
  bordered?: boolean
}

const ProfileGroup = ({title, items, group, bordered}: ProfileGroupProps) => {
  if (items.length === 0) {
    return null
  }

  return (
    <>
      <span className='mr-2 text-xs font-polysans font-normal uppercase opacity-80'>
        {title}
      </span>
      <div
        className={[
          'flex flex-wrap items-center gap-2 py-3',
          bordered
            ? 'border-b-[0.5px] border-dotted dark:border-light-gray/20'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}>
        {items.map((item) => (
          <ProductProfile key={item} name={item} group={group} />
        ))}
      </div>
    </>
  )
}

export const ProductDetails = ({product}: ProductDetailsProps) => {
  const hasProfileDetails =
    Boolean(product.lineage) ||
    product.noseRating != null ||
    product.terpenes.length > 0 ||
    product.flavorNotes.length > 0 ||
    product.effects.length > 0
  const hasExperienceDetails =
    Boolean(product.potencyProfile) || Boolean(product.consumption)

  if (!hasProfileDetails && !hasExperienceDetails) {
    return null
  }

  return (
    <>
      {hasProfileDetails ? (
        <div className='p-2 md:p-6'>
          <div className='rounded-xs bg-linear-to-r from-dark-gray/5 via-dark-gray/5 to-dark-gray/5 p-4 space-y-3 dark:bg-background/30'>
            {product.lineage ? (
              <>
                <span className='mr-2 text-xs font-polysans font-normal uppercase opacity-80'>
                  Lineage
                </span>
                <div className='flex flex-wrap items-center gap-2 border-b-[0.5px] border-dotted py-3 dark:border-light-gray/20'>
                  {product.lineage}
                </div>
              </>
            ) : null}

            {product.noseRating != null ? (
              <>
                <span className='mr-2 text-xs font-polysans font-normal uppercase opacity-80'>
                  Nose Rating
                </span>
                <div className='flex flex-wrap items-center gap-2 border-b-[0.5px] border-dotted py-3 dark:border-light-gray/20'>
                  {product.noseRating}
                </div>
              </>
            ) : null}

            <ProfileGroup
              title='Terpenes'
              items={product.terpenes}
              group='terpenes'
              bordered
            />
            <ProfileGroup
              title='Flavor Notes'
              items={product.flavorNotes}
              group='flavors'
              bordered
            />
            <ProfileGroup
              title='Effects'
              items={product.effects}
              group='effects'
            />
          </div>
        </div>
      ) : null}

      {hasExperienceDetails ? (
        <div className='space-y-4 p-4 [content-visibility:auto] [contain-intrinsic-size:12rem]'>
          {product.potencyProfile ? (
            <h3 className='min-h-14'>
              <span className='mr-2 font-sans font-semibold tracking-tight opacity-80'>
                Experience:
              </span>
              <span className='text-xs sm:text-sm opacity-70 text-color-muted leading-relaxed'>
                {product.potencyProfile}
              </span>
            </h3>
          ) : null}

          {product.consumption ? (
            <h3 className='min-h-14'>
              <span className='mr-2 font-sans font-semibold tracking-tight opacity-80'>
                Smoke/Consumption:
              </span>
              <span className='text-xs sm:text-sm opacity-70 text-color-muted leading-relaxed'>
                {product.consumption}
              </span>
            </h3>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
