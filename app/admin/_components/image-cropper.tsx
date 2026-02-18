'use client'

import {useCallback, useEffect, useState} from 'react'

import {EdgeSlider} from '@/components/ui/slider'
import {Button, Image as HeroImage} from '@heroui/react'
import {
  Cropper,
  CropperCropArea,
  CropperDescription,
  CropperImage,
} from './ui/cropper'

// Define type for pixel crop area
type Area = {x: number; y: number; width: number; height: number}

const ORIGINAL_IMAGE_URL =
  'https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/cropper-08_wneftq.jpg'

// --- Start: Copied Helper Functions ---
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous') // Needed for canvas Tainted check
    image.src = url
  })

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  outputWidth: number = pixelCrop.width, // Optional: specify output size
  outputHeight: number = pixelCrop.height,
): Promise<Blob | null> {
  try {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      return null
    }

    // Set canvas size to desired output size
    canvas.width = outputWidth
    canvas.height = outputHeight

    // Draw the cropped image onto the canvas
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      outputWidth, // Draw onto the output size
      outputHeight,
    )

    // Convert canvas to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/jpeg') // Specify format and quality if needed
    })
  } catch (error) {
    console.error('Error in getCroppedImg:', error)
    return null
  }
}

export const ImageCropper = () => {
  const [zoom, setZoom] = useState(1.4)

  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null)

  // Callback to update crop area state
  const handleCropChange = useCallback((pixels: Area | null) => {
    setCroppedAreaPixels(pixels)
  }, [])

  // Function to handle the crop button click
  const handleCrop = async () => {
    if (!croppedAreaPixels) {
      console.error('No crop area selected.')
      return
    }

    try {
      const croppedBlob = await getCroppedImg(
        ORIGINAL_IMAGE_URL,
        croppedAreaPixels,
      )
      if (!croppedBlob) {
        throw new Error('Failed to generate cropped image blob.')
      }

      // Create a new object URL
      const newCroppedUrl = URL.createObjectURL(croppedBlob)

      // Revoke the old URL if it exists
      if (croppedImageUrl) {
        URL.revokeObjectURL(croppedImageUrl)
      }

      // Set the new URL
      setCroppedImageUrl(newCroppedUrl)
    } catch (error) {
      console.error('Error during cropping:', error)
      // Optionally: Clear the old image URL on error
      if (croppedImageUrl) {
        URL.revokeObjectURL(croppedImageUrl)
      }
      setCroppedImageUrl(null)
    }
  }

  // Effect for cleaning up the object URL
  useEffect(() => {
    // This is the cleanup function that runs when the component unmounts
    // or when croppedImageUrl changes before the next effect runs.
    const currentUrl = croppedImageUrl
    return () => {
      if (currentUrl && currentUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentUrl)
        console.log('Revoked URL:', currentUrl) // Optional: for debugging
      }
    }
  }, [croppedImageUrl]) // Dependency array ensures cleanup runs when URL changes

  return (
    <div className='flex flex-col items-center gap-2'>
      <div className='relative flex w-full flex-col gap-4'>
        <Cropper
          className='h-160 bg-origin/80 rounded-sm'
          image={ORIGINAL_IMAGE_URL}
          zoom={zoom}
          onCropChange={handleCropChange}
          onZoomChange={setZoom}>
          <CropperDescription />
          <CropperImage />
          <CropperCropArea className='border-teal-400' />
        </Cropper>
        <div className='mx-auto flex w-full max-w-80 items-center gap-1'>
          <EdgeSlider
            defaultValue={[1]}
            value={[zoom]}
            min={1}
            max={3}
            step={0.1}
            onValueChange={(value) => setZoom(+value)}
            aria-label='Zoom slider'
          />
          <output className='block w-10 shrink-0 text-right text-sm font-medium tabular-nums'>
            {parseFloat(zoom.toFixed(1))}x
          </output>
        </div>
      </div>

      <div className='relative flex w-full'>
        {/*<AnimatePresence mode='popLayout'>*/}
        <div className='aspect-square size-24 overflow-hidden rounded-full'>
          {croppedImageUrl && (
            <HeroImage
              src={croppedImageUrl}
              alt='Cropped result'
              width={1000}
              height={1000}
              className='h-24 w-24 object-cover'
            />
          )}
        </div>
        {/*</AnimatePresence>*/}
        <Button onPress={handleCrop} disabled={!croppedAreaPixels}>
          Crop preview
        </Button>
      </div>
    </div>
  )
}
