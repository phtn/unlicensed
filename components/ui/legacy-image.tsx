/* eslint-disable @next/next/no-img-element */

import type {ImgHTMLAttributes} from 'react'

export type LegacyImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  radius?: string
  shadow?: string
  removeWrapper?: boolean
}

export const LegacyImage = ({
  radius: _radius,
  shadow: _shadow,
  removeWrapper: _removeWrapper,
  ...props
}: LegacyImageProps) => {
  return <img {...props} alt={props.alt ?? ''} />
}
