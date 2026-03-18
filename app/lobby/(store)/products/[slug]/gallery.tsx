import {StoreProduct} from '@/app/types'
import {Lens} from '@/components/ui/lens'
import {useToggle} from '@/hooks/use-toggle'
import {cn} from '@/lib/utils'
import {Image} from '@heroui/react'
import {memo, RefObject, useMemo, useState} from 'react'

type GalleryProps = {
  product: StoreProduct
  imageRef?: RefObject<HTMLDivElement | null>
  primaryImageUrl?: string
  galleryImages: string[]
  isMobile: boolean
}

const GalleryComponent = ({
  product,
  imageRef,
  primaryImageUrl,
  galleryImages,
  isMobile,
}: GalleryProps) => {
  const {on, setOn} = useToggle()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const allImages = useMemo(
    () =>
      [primaryImageUrl, ...galleryImages].filter(
        (image, index, images): image is string =>
          !!image && images.indexOf(image) === index,
      ),
    [galleryImages, primaryImageUrl],
  )
  const activeImage = useMemo(
    () =>
      selectedImage && allImages.includes(selectedImage)
        ? selectedImage
        : allImages[0],
    [allImages, selectedImage],
  )

  return (
    <section className='flex flex-col gap-y-3 sm:gap-0'>
      <div
        ref={imageRef}
        className='relative aspect-auto sm:rounded-s-xs lg:border-s lg:border-e-none lg:border-y border-foreground/10 dark:border-foreground/30 w-full md:max-h-115 overflow-hidden bg-background/60 lg:min-h-168'>
        <Lens hovering={isMobile ? false : on} setHovering={setOn}>
          <Image
            radius='none'
            src={activeImage}
            alt={product.name}
            className='object-cover portrait:aspect-square portrait:size-full w-full h-full aspect-auto select-none rounded-xs md:rounded-none'
            loading='eager'
          />
        </Lens>
      </div>
      <div className='flex items-start w-full overflow-x-auto overflow-y-hidden gap-2 p-1 mt-8 lg:mt-0'>
        {allImages.map((src, index) => (
          <button
            type='button'
            key={`${src}-${index}`}
            onClick={() => setSelectedImage(src)}
            className={cn(
              'shrink-0 cursor-pointer select-none relative ring-2 aspect-square overflow-hidden rounded-none size-20 md:size-28',
              activeImage === src
                ? 'border-foreground/50 ring-brand'
                : 'border-foreground/10 dark:ring-foreground/40 hover:border-foreground/30',
            )}
            aria-label={`View ${product.name} image ${index + 1}`}
            aria-pressed={activeImage === src}>
            <Image
              radius='none'
              src={src}
              alt={`${product.name} gallery ${index + 1}`}
              className='object-cover size-full rounded-none aspect-square'
              loading='lazy'
            />
          </button>
        ))}
      </div>
    </section>
  )
}

GalleryComponent.displayName = 'Gallery'

export const Gallery = memo(GalleryComponent)
