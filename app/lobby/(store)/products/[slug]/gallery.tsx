import {StoreProduct} from '@/app/types'
import {Lens} from '@/components/ui/lens'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useToggle} from '@/hooks/use-toggle'
import {cn} from '@/lib/utils'
import {Image} from '@heroui/react'
import {useQuery} from 'convex/react'
import {RefObject, startTransition, useCallback, useMemo, useState} from 'react'

export const Gallery = ({
  product,
  imageRef,
  productId,
  isMobile,
}: {
  product: StoreProduct
  imageRef?: RefObject<HTMLDivElement | null>
  productId?: Id<'products'>
  isMobile: boolean
}) => {
  const {on, setOn} = useToggle()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Get primary image URL
  const primaryImageUrl = useQuery(
    api.products.q.getPrimaryImage,
    productId ? {id: productId} : 'skip',
  )

  // Get gallery images - only query if we have a valid productId
  const galleryUrls = useQuery(
    api.products.q.listGallery,
    productId ? {id: productId} : 'skip',
  )

  const displayImage = useMemo(
    () => selectedImage ?? primaryImageUrl ?? undefined,
    [selectedImage, primaryImageUrl],
  )
  const handleSelectImage = useCallback(
    (src: string) => () => {
      startTransition(() => {
        setSelectedImage(src)
      })
    },
    [],
  )

  return (
    <div className='flex flex-col gap-y-3 sm:gap-0'>
      <div
        ref={imageRef}
        className='relative aspect-auto w-full md:max-h-115 overflow-hidden bg-background/60 lg:min-h-168'>
        <Lens hovering={isMobile ? false : on} setHovering={setOn}>
          <Image
            radius='none'
            src={displayImage}
            alt={product.name}
            className='object-cover portrait:aspect-square portrait:size-full w-full h-full aspect-auto select-none'
            loading='eager'
          />
        </Lens>
      </div>
      <div className='flex items-center w-full lg:w-full overflow-y-scroll gap-2 p-1'>
        {[primaryImageUrl, ...(galleryUrls ?? [])].map((src, index) => (
          <div
            key={`${src}-${index}`}
            onClick={() => src && handleSelectImage(src)()}
            className={cn(
              'cursor-pointer select-none relative aspect-square overflow-hidden rounded-md size-full md:size-32',
              selectedImage === src
                ? 'border-foreground/50 ring-2 ring-limited'
                : 'border-foreground/10 hover:border-foreground/30',
            )}>
            {src && (
              <Image
                src={src}
                alt={`${product.name} gallery ${index + 1}`}
                className='object-cover md:size-20 size-full portrait:aspect-square lg:size-32 aspect-auto'
                loading='lazy'
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
