'use client'

import {ThemeProvider} from '@/components/ui/theme-provider'
import {getConvexReactClient} from '@/lib/convexReactClient'
import {HeroUIProvider} from '@heroui/react'
import {ConvexProvider} from 'convex/react'
import {createContext, useContext, useMemo, type ReactNode} from 'react'
import {AuthCtxProvider} from './auth'
import {CartAnimationProvider} from './cart-animation'
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
        attribute='class'
        enableColorScheme
        defaultTheme='dark'
        disableTransitionOnChange>
        <AuthCtxProvider>{children}</AuthCtxProvider>
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
