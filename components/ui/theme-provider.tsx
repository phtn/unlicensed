'use client'

import {
  THEME_ATTRIBUTE,
  THEME_DEFAULT_THEME,
  THEME_ENABLE_COLOR_SCHEME,
  THEME_ENABLE_SYSTEM,
  THEME_LEGACY_STORAGE_KEYS,
  THEME_STORAGE_KEY,
  THEME_THEMES,
} from '@/lib/theme'
import type {ThemeProviderProps, UseThemeProps} from 'next-themes'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'

const MEDIA_QUERY = '(prefers-color-scheme: dark)'
const COLOR_SCHEME_THEMES = new Set(['light', 'dark'])
const ThemeContext = createContext<UseThemeProps>({
  setTheme: () => undefined,
  themes: [...THEME_THEMES],
})

type HyfeThemeProviderProps = ThemeProviderProps & {
  legacyStorageKeys?: readonly string[]
}

function getStoredTheme(
  storageKey: string,
  defaultTheme: string,
  legacyStorageKeys: readonly string[],
) {
  if (typeof window === 'undefined') return undefined

  try {
    const storedTheme =
      localStorage.getItem(storageKey) ??
      legacyStorageKeys
        .map((legacyStorageKey) => localStorage.getItem(legacyStorageKey))
        .find((value) => value != null)

    return storedTheme ?? defaultTheme
  } catch {
    return defaultTheme
  }
}

function getSystemTheme(event?: MediaQueryList | MediaQueryListEvent) {
  if (typeof window === 'undefined') return undefined

  return (event ?? window.matchMedia(MEDIA_QUERY)).matches ? 'dark' : 'light'
}

function withoutTransitions(nonce?: string) {
  const style = document.createElement('style')

  if (nonce) {
    style.setAttribute('nonce', nonce)
  }

  style.appendChild(
    document.createTextNode('*,*::before,*::after{transition:none!important}'),
  )
  document.head.appendChild(style)

  return () => {
    window.getComputedStyle(document.body)
    window.setTimeout(() => {
      document.head.removeChild(style)
    }, 1)
  }
}

export function ThemeProvider(props: HyfeThemeProviderProps) {
  const {
    attribute = THEME_ATTRIBUTE,
    children,
    defaultTheme = THEME_DEFAULT_THEME,
    disableTransitionOnChange = false,
    enableColorScheme = THEME_ENABLE_COLOR_SCHEME,
    enableSystem = THEME_ENABLE_SYSTEM,
    forcedTheme,
    legacyStorageKeys = THEME_LEGACY_STORAGE_KEYS,
    nonce,
    storageKey = THEME_STORAGE_KEY,
    themes = [...THEME_THEMES],
    value,
  } = props

  const [theme, setThemeState] = useState<string | undefined>(() =>
    getStoredTheme(storageKey, defaultTheme, legacyStorageKeys),
  )
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark' | undefined>(
    () => getSystemTheme(),
  )

  const applyTheme = useCallback(
    (nextTheme?: string) => {
      if (!nextTheme) return

      const root = document.documentElement
      const attributes = Array.isArray(attribute) ? attribute : [attribute]
      const resolvedTheme =
        nextTheme === 'system' && enableSystem ? getSystemTheme() : nextTheme
      const mappedThemes = value
        ? themes.map((themeName) => value[themeName] ?? themeName)
        : themes
      const resolvedValue = value?.[resolvedTheme ?? ''] ?? resolvedTheme
      const cleanupTransitions = disableTransitionOnChange
        ? withoutTransitions(nonce)
        : null

      for (const currentAttribute of attributes) {
        if (currentAttribute === 'class') {
          root.classList.remove(...mappedThemes)
          if (resolvedValue) {
            root.classList.add(resolvedValue)
          }
          continue
        }

        if (resolvedValue) {
          root.setAttribute(currentAttribute, resolvedValue)
          continue
        }

        root.removeAttribute(currentAttribute)
      }

      if (enableColorScheme) {
        const colorScheme = COLOR_SCHEME_THEMES.has(resolvedTheme ?? '')
          ? resolvedTheme
          : COLOR_SCHEME_THEMES.has(defaultTheme)
            ? defaultTheme
            : undefined

        if (colorScheme) {
          root.style.colorScheme = colorScheme
        } else {
          root.style.removeProperty('color-scheme')
        }
      }

      cleanupTransitions?.()
    },
    [
      attribute,
      defaultTheme,
      disableTransitionOnChange,
      enableColorScheme,
      enableSystem,
      nonce,
      themes,
      value,
    ],
  )

  const setTheme = useCallback<Dispatch<SetStateAction<string>>>(
    (nextTheme) => {
      setThemeState((currentTheme) => {
        const updatedTheme =
          typeof nextTheme === 'function'
            ? nextTheme(currentTheme ?? defaultTheme)
            : nextTheme

        try {
          localStorage.setItem(storageKey, updatedTheme)
          for (const legacyStorageKey of legacyStorageKeys) {
            localStorage.removeItem(legacyStorageKey)
          }
        } catch {}

        return updatedTheme
      })
    },
    [defaultTheme, legacyStorageKeys, storageKey],
  )

  useEffect(() => {
    if (!enableSystem) return

    const mediaQuery = window.matchMedia(MEDIA_QUERY)
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(getSystemTheme(event))
    }

    setSystemTheme(getSystemTheme(mediaQuery))
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [enableSystem])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return

      setThemeState(event.newValue ?? defaultTheme)
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [defaultTheme, storageKey])

  useEffect(() => {
    applyTheme(forcedTheme ?? theme)
  }, [applyTheme, forcedTheme, systemTheme, theme])

  const contextValue = useMemo<UseThemeProps>(
    () => ({
      forcedTheme,
      resolvedTheme: theme === 'system' ? systemTheme : theme,
      setTheme,
      systemTheme,
      theme,
      themes: enableSystem ? [...themes, 'system'] : [...themes],
    }),
    [enableSystem, forcedTheme, setTheme, systemTheme, theme, themes],
  )

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
