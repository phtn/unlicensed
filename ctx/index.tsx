'use client'

import {ThemeProvider} from '@/components/ui/theme-provider'
import {useFirebaseAuthUser} from '@/hooks/use-firebase-auth-user'
import {getConvexReactClient} from '@/lib/convexReactClient'
import {
  THEME_ATTRIBUTE,
  THEME_DEFAULT_THEME,
  THEME_ENABLE_COLOR_SCHEME,
  THEME_ENABLE_SYSTEM,
} from '@/lib/theme'
import {ConvexProviderWithAuth} from 'convex/react'
import {createContext, useCallback, useContext, useMemo, type ReactNode} from 'react'
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

function useFirebaseConvexAuth() {
  const {user, isLoading} = useFirebaseAuthUser()

  const fetchAccessToken = useCallback(
    async ({forceRefreshToken}: {forceRefreshToken: boolean}) => {
      if (!user) {
        return null
      }

      return user.getIdToken(forceRefreshToken)
    },
    [user],
  )

  return useMemo(
    () => ({
      isLoading,
      isAuthenticated: Boolean(user),
      fetchAccessToken,
    }),
    [fetchAccessToken, isLoading, user],
  )
}

const ProvidersCtxProvider = ({children}: ProvidersProviderProps) => {
  const convexClient = useMemo(() => getConvexReactClient(), [])

  const content = (
    <div className='min-h-screen'>
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
    </div>
  )

  return (
    <ConvexProviderWithAuth
      client={convexClient}
      useAuth={useFirebaseConvexAuth}>
      <PinAccessProvider>
        <CartAnimationProvider>{content}</CartAnimationProvider>
      </PinAccessProvider>
    </ConvexProviderWithAuth>
  )
}

const useProvidersCtx = () => {
  const ctx = useContext(ProvidersCtx)
  if (!ctx) throw new Error('ProvidersCtxProvider is missing')
  return ctx
}

export {ProvidersCtx, ProvidersCtxProvider, useProvidersCtx}
