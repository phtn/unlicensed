'use client'

import {ThemeProvider} from '@/components/ui/theme-provider'
import {getConvexReactClient} from '@/lib/convexReactClient'
import {HeroUIProvider} from '@heroui/react'
import {ConvexProvider} from 'convex/react'
import {createContext, useContext, useMemo, type ReactNode} from 'react'
import {CartAnimationProvider} from './cart-animation'

interface ProvidersProviderProps {
  children: ReactNode
}

const ProvidersCtx = createContext(null)

const ProvidersCtxProvider = ({children}: ProvidersProviderProps) => {
  const convexClient = useMemo(() => getConvexReactClient(), [])

  const content = (
    <HeroUIProvider locale='en-US' className='min-h-screen'>
      <ThemeProvider
        enableSystem
        attribute='class'
        enableColorScheme
        defaultTheme='system'
        disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </HeroUIProvider>
  )

  return (
    <ConvexProvider client={convexClient}>
      <CartAnimationProvider>{content}</CartAnimationProvider>
    </ConvexProvider>
  )
}

const useProvidersCtx = () => {
  const ctx = useContext(ProvidersCtx)
  if (!ctx) throw new Error('ProvidersCtxProvider is missing')
  return ctx
}

export {ProvidersCtx, ProvidersCtxProvider, useProvidersCtx}
