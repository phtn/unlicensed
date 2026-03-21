'use client'

import {StoreProduct} from '@/app/types'
import {useMobile} from '@/hooks/use-mobile'
import {cn} from '@/lib/utils'
import dynamic from 'next/dynamic'
import NextImage from 'next/image'
import {memo, useMemo, useState} from 'react'

const Lens = dynamic(
  () => import('@/components/ui/lens').then((module) => module.Lens),
  {ssr: false},
)

type GalleryProps = {
  product: StoreProduct
  primaryImageUrl?: string
  galleryImages: string[]
}

const GalleryComponent = ({
  product,
  primaryImageUrl,
  galleryImages,
}: GalleryProps) => {
  const isMobile = useMobile()
  const [isHovering, setIsHovering] = useState(false)
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
  const galleryFrame = (
    <div className='relative aspect-square w-full overflow-hidden bg-background/60 sm:rounded-s-xs lg:aspect-auto lg:min-h-168 lg:border-y lg:border-s lg:border-e-none border-foreground/10 dark:border-foreground/30'>
      {activeImage ? (
        <NextImage
          src={activeImage}
          alt={product.name}
          fill
          priority
          unoptimized
          sizes='(min-width: 1280px) 42rem, (min-width: 1024px) 52vw, 100vw'
          className='select-none object-cover portrait:aspect-square portrait:size-full rounded-xs md:rounded-none'
        />
      ) : (
        <div className='aspect-square size-full bg-background/40' />
      )}
    </div>
  )

  return (
    <section className='flex flex-col gap-y-1 sm:gap-0'>
      {isMobile ? (
        galleryFrame
      ) : (
        <Lens hovering={isHovering} setHovering={setIsHovering}>
          {galleryFrame}
        </Lens>
      )}
      <div className='flex w-full items-start md:gap-2 overflow-x-auto overflow-y-hidden p-1 lg:mt-0'>
        {allImages.map((src, index) => (
          <button
            type='button'
            key={`${src}-${index}`}
            onClick={() => setSelectedImage(src)}
            className={cn(
              'relative size-20 shrink-0 cursor-pointer overflow-hidden rounded-none ring-2 md:size-28',
              activeImage === src
                ? 'border-foreground/50 ring-brand'
                : 'border-foreground/10 dark:ring-foreground/40 hover:border-foreground/30',
            )}
            aria-label={`View ${product.name} image ${index + 1}`}
            aria-pressed={activeImage === src}>
            <NextImage
              src={src}
              alt={`${product.name} gallery ${index + 1}`}
              fill
              unoptimized
              sizes='7rem'
              className='rounded-none object-cover'
            />
          </button>
        ))}
      </div>
    </section>
  )
}

GalleryComponent.displayName = 'Gallery'

export const Gallery = memo(GalleryComponent)
