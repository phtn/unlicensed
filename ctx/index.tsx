'use client'

import {HeroUIProvider} from '@heroui/react'
import {ConvexProvider} from 'convex/react'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {getConvexReactClient} from '@/lib/convexReactClient'

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

const STORAGE_KEY = 'hyfe-theme-preference'

const applyTheme = (theme: Theme) => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.theme = theme
  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('light', theme === 'light')
  root.style.colorScheme = theme
}

const getPreferredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark'

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
  return prefersLight ? 'light' : 'dark'
}

const ProvidersCtx = createContext<ProvidersCtxValue | null>(null)

const ProvidersCtxProvider = ({children}: ProvidersProviderProps) => {
  const convexClient = useMemo(() => getConvexReactClient(), [])
  const [theme, setThemeState] = useState<Theme>(() => {
    const preferredTheme = getPreferredTheme()
    applyTheme(preferredTheme)
    return preferredTheme
  })
  const [isThemeReady] = useState(true)

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, nextTheme)
    }
    applyTheme(nextTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const nextTheme = current === 'dark' ? 'light' : 'dark'
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, nextTheme)
      }
      applyTheme(nextTheme)
      return nextTheme
    })
  }, [])

  const contextValue = useMemo<ProvidersCtxValue>(
    () => ({
      theme,
      isThemeReady,
      setTheme,
      toggleTheme,
    }),
    [isThemeReady, setTheme, theme, toggleTheme],
  )

  const content = (
    <HeroUIProvider locale='en-US' className='min-h-screen'>
      {children}
    </HeroUIProvider>
  )

  return (
    <ProvidersCtx.Provider value={contextValue}>
      <ConvexProvider client={convexClient}>{content}</ConvexProvider>
    </ProvidersCtx.Provider>
  )
}

const useProvidersCtx = () => {
  const ctx = useContext(ProvidersCtx)
  if (!ctx) throw new Error('ProvidersCtxProvider is missing')
  return ctx
}

export {ProvidersCtx, ProvidersCtxProvider, useProvidersCtx}
