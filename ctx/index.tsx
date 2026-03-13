'use client'

import {ThemeProvider} from '@/components/ui/theme-provider'
import {getConvexReactClient} from '@/lib/convexReactClient'
import {
  THEME_ATTRIBUTE,
  THEME_DEFAULT_THEME,
  THEME_ENABLE_COLOR_SCHEME,
  THEME_ENABLE_SYSTEM,
} from '@/lib/theme'
import {HeroUIProvider} from '@heroui/react'
import {ConvexProvider} from 'convex/react'
import {createContext, useContext, useMemo, type ReactNode} from 'react'
import {AuthCtxProvider} from './auth'
import {CartAnimationProvider} from './cart-animation'
import {GuestChatProvider} from './guest-chat'
import {PendingDealsProvider} from './pending-deals'
import {PinAccessProvider} from './pin-access'
import {Toasts} from './toast'

interface ProvidersProviderProps {
  children: ReactNode
}

const ProvidersCtx = createContext(null)

const ProvidersCtxProvider = ({children}: ProvidersProviderProps) => {
  const convexClient = useMemo(() => getConvexReactClient(), [])

  const content = (
    <HeroUIProvider locale='en-US' className='min-h-screen'>
      <ThemeProvider
        attribute={THEME_ATTRIBUTE}
        enableColorScheme={THEME_ENABLE_COLOR_SCHEME}
        enableSystem={THEME_ENABLE_SYSTEM}
        defaultTheme={THEME_DEFAULT_THEME}
        disableTransitionOnChange>
        <AuthCtxProvider>
          <GuestChatProvider>
            <PendingDealsProvider>{children}</PendingDealsProvider>
          </GuestChatProvider>
        </AuthCtxProvider>
        <Toasts />
      </ThemeProvider>
    </HeroUIProvider>
  )

  return (
    <ConvexProvider client={convexClient}>
      <PinAccessProvider>
        <CartAnimationProvider>{content}</CartAnimationProvider>
      </PinAccessProvider>
    </ConvexProvider>
  )
}

const useProvidersCtx = () => {
  const ctx = useContext(ProvidersCtx)
  if (!ctx) throw new Error('ProvidersCtxProvider is missing')
  return ctx
}

export {ProvidersCtx, ProvidersCtxProvider, useProvidersCtx}
