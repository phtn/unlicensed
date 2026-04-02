'use client'

import {useAuthCtx} from '@/ctx/auth'

export const useAuth = () => {
  const {user, loading, convexUser, convexUserId, isConvexUserLoading} =
    useAuthCtx()

  return {
    user,
    loading,
    convexUser,
    convexUserId,
    isConvexUserLoading,
  }
}
