'use client'

import {ThemeProvider} from '@/components/ui/theme-provider'
import {getConvexReactClient} from '@/lib/convexReactClient'
import {HeroUIProvider} from '@heroui/react'
import {ConvexProvider} from 'convex/react'
import {useTheme} from 'next-themes'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {CartAnimationProvider} from './cart-animation'
// import {GoogleOneTap} from '@/components/auth/google-one-tap'
// import {googleClientId} from '@/lib/firebase/config'

type Theme = 'light' | 'dark'

type ProvidersCtxValue = {
  theme: Theme
  isThemeReady: boolean
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

interface ProvidersProviderProps {
  children: ReactNode
}

const ProvidersCtx = createContext<ProvidersCtxValue | null>(null)

const ThemeContextProvider = ({children}: ProvidersProviderProps) => {
  const {
    theme: nextThemeValue,
    setTheme: setNextTheme,
    resolvedTheme,
    systemTheme,
  } = useTheme()

  // Use mounted state to determine if theme is ready
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isThemeReady = mounted && resolvedTheme !== undefined

  const theme = useMemo<Theme>(() => {
    if (!mounted) return 'dark' // Default during SSR
    // If theme is explicitly set to 'light' or 'dark', use it
    // Otherwise use resolvedTheme or systemTheme
    if (nextThemeValue === 'light' || nextThemeValue === 'dark') {
      return nextThemeValue
    }
    return (resolvedTheme ?? systemTheme ?? 'dark') as Theme
  }, [mounted, nextThemeValue, resolvedTheme, systemTheme])

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setNextTheme(newTheme)
    },
    [setNextTheme],
  )

  const toggleTheme = useCallback(() => {
    // Get the actual resolved theme (not 'system')
    const currentResolvedTheme = (resolvedTheme ?? systemTheme ?? 'dark') as Theme
    setNextTheme(currentResolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, systemTheme, setNextTheme])

  const contextValue = useMemo<ProvidersCtxValue>(
    () => ({
      theme,
      isThemeReady,
      setTheme,
      toggleTheme,
    }),
    [isThemeReady, setTheme, theme, toggleTheme],
  )

  return (
    <ProvidersCtx.Provider value={contextValue}>
      {children}
    </ProvidersCtx.Provider>
  )
}

const ProvidersCtxProvider = ({children}: ProvidersProviderProps) => {
  const convexClient = useMemo(() => getConvexReactClient(), [])

  const content = (
    <HeroUIProvider locale='en-US' className='min-h-screen'>
      <ThemeProvider
        attribute='class'
        defaultTheme='system'
        enableSystem
        enableColorScheme
        disableTransitionOnChange
        storageKey='hyfe-theme-preference'>
        <ThemeContextProvider>{children}</ThemeContextProvider>
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
