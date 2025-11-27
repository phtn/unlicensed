/** @paper-design/shaders-react@0.0.57 */
import {Dithering, ImageDithering} from '@paper-design/shaders-react'

/**
 * Code exported from Paper
 * https://app.paper.design/file/01K56VPQEXA37YGGD0GZACCRY2?node=01K7CWW05AD5874GRGP1J5CCYE
 * on Oct 13, 2025 at 3:14 AM.
 */
export function DitherPhoto() {
  return (
    <Dithering
      colorBack='#00000000'
      colorFront='#f0f0f0'
      speed={1}
      shape='simplex'
      type='4x4'
      size={2.0}
      fit='cover'
      scale={0.33}
      frame={249792.6859999941}
      className='size-full absolute rounded-xl rotate-6 scale-125'
    />
  )
}

/**
 * Code exported from Paper
 * https://app.paper.design/file/01K56VPQEXA37YGGD0GZACCRY2?node=01K7CX1625EJER9WJ17N6N85RG
 * on Oct 13, 2025 at 3:17 AM.
 * @param {string} image - The URL of the image to dither.
 */
interface ImageDitherProps {
  image: string
}

export function ImageDither({image}: ImageDitherProps) {
  return (
    <ImageDithering
      colorBack='#00000000'
      colorFront='#EEEEEE'
      colorHighlight='#EEEEEE'
      originalColors
      type='2x2'
      size={2.4}
      colorSteps={2}
      image={image}
      scale={1}
      fit='cover'
      className='size-full absolute'
    />
  )
}
