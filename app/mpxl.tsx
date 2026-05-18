'use client'

import {api} from '@/convex/_generated/api'
import {
  getMetaPixelId,
  META_PIXEL_IDENTIFIER,
  trackMetaPixelPageView,
} from '@/lib/meta-pixel'
import {useQuery} from 'convex/react'
import {usePathname, useSearchParams} from 'next/navigation'
import Script from 'next/script'
import {useEffect, useMemo, useRef} from 'react'

export function MetaPixel() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const setting = useQuery(api.admin.q.getAdminByIdentStrict, {
    identifier: META_PIXEL_IDENTIFIER,
  })
  const lastTrackedPathRef = useRef<string | null>(null)

  const pixelId = useMemo(() => getMetaPixelId(setting), [setting])
  const queryString = searchParams.toString()
  const fullPath = useMemo(
    () => (queryString.length > 0 ? `${pathname}?${queryString}` : pathname),
    [pathname, queryString],
  )

  useEffect(() => {
    if (!pixelId) {
      lastTrackedPathRef.current = null
      return
    }

    if (lastTrackedPathRef.current === null) {
      lastTrackedPathRef.current = fullPath
      return
    }

    if (lastTrackedPathRef.current === fullPath) {
      return
    }

    lastTrackedPathRef.current = fullPath
    trackMetaPixelPageView()
  }, [fullPath, pixelId])

  if (!pixelId) {
    return null
  }

  return (
    <>
      <Script id='facebook-pixel-base' strategy='afterInteractive'>
        {`
          !(function(f,b,e,v,n,t,s){
            if(f.fbq)return;
            n=f.fbq=function(){
              n.callMethod
                ? n.callMethod.apply(n,arguments)
                : n.queue.push(arguments)
            };
            if(!f._fbq)f._fbq=n;
            n.push=n;
            n.loaded=!0;
            n.version='2.0';
            n.queue=[];
            t=b.createElement(e);
            t.async=!0;
            t.src=v;
            s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s);
          })(
            window,
            document,
            'script',
            'https://connect.facebook.net/en_US/fbevents.js'
          );
        `}
      </Script>

      <Script
        id={`facebook-pixel-init-${pixelId}`}
        strategy='afterInteractive'>
        {`
          fbq('init', ${JSON.stringify(pixelId)});
          fbq('track', 'PageView');
        `}
      </Script>
    </>
  )
}
