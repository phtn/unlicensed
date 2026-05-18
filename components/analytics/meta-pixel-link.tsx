'use client'

import {
  trackMetaPixelCustom,
  type MetaPixelEventParameters,
} from '@/lib/meta-pixel'
import Link from 'next/link'
import type {ComponentProps} from 'react'

type MetaPixelLinkProps = ComponentProps<typeof Link> & {
  trackingEventName?: string
  trackingParameters?: MetaPixelEventParameters
}

export function MetaPixelLink({
  trackingEventName,
  trackingParameters,
  onClick,
  ...props
}: MetaPixelLinkProps) {
  const handleClick: NonNullable<ComponentProps<typeof Link>['onClick']> = (
    event,
  ) => {
    if (trackingEventName) {
      trackMetaPixelCustom(trackingEventName, trackingParameters)
    }

    onClick?.(event)
  }

  return <Link {...props} onClick={handleClick} />
}
