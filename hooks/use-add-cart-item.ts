'use client'

import {useAuthCtx} from '@/ctx/auth'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {getConvexReactClient} from '@/lib/convexReactClient'
import {getCurrentUser} from '@/lib/firebase/auth'
import {addToLocalStorageCart} from '@/lib/localStorageCart'
import {useCallback, useRef} from 'react'

type CachedUserId = {
  fid: string
  userId: Id<'users'>
}

export const useAddCartItem = () => {
  const {user} = useAuthCtx()
  const cachedUserIdRef = useRef<CachedUserId | null>(null)

  return useCallback(
    async (
      productId: Id<'products'>,
      quantity: number = 1,
      denomination?: number,
    ) => {
      const currentUser = user ?? getCurrentUser()

      if (currentUser?.uid) {
        const cachedUserId = cachedUserIdRef.current
        const convexClient = getConvexReactClient()
        let userId =
          cachedUserId?.fid === currentUser.uid ? cachedUserId.userId : null

        if (!userId) {
          const convexUser = await convexClient.query(
            api.users.q.getCurrentUser,
            {
              fid: currentUser.uid,
            },
          )

          if (convexUser?._id) {
            userId = convexUser._id
            cachedUserIdRef.current = {fid: currentUser.uid, userId}
          }
        }

        if (userId) {
          return convexClient.mutation(api.cart.m.addToCart, {
            userId,
            productId,
            quantity,
            denomination,
          })
        }
      }

      addToLocalStorageCart(productId, quantity, denomination)
      return 'guest-cart' as Id<'carts'>
    },
    [user],
  )
}
