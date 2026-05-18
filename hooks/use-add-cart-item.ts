'use client'

import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {getConvexReactClient} from '@/lib/convexReactClient'
import {getCurrentUser} from '@/lib/firebase/auth'
import {addToLocalStorageCart} from '@/lib/localStorageCart'
import {trackMetaPixelAddToCart} from '@/lib/meta-pixel'
import {useCallback} from 'react'

export const useAddCartItem = () => {
  const {user, convexUserId} = useAuthCtx()

  return useCallback(
    async (
      productId: Id<'products'>,
      quantity: number = 1,
      denomination?: number,
    ) => {
      const currentUser = user ?? getCurrentUser()

      if (currentUser?.uid) {
        const convexClient = getConvexReactClient()
        let userId = convexUserId

        if (!userId) {
          const convexUser = await convexClient.query(
            api.users.q.getCurrentUser,
            {
              fid: currentUser.uid,
            },
          )
          userId = convexUser?._id ?? null
        }

        if (userId) {
          const cartId = await convexClient.mutation(api.cart.m.addToCart, {
            userId,
            productId,
            quantity,
            denomination,
          })

          trackMetaPixelAddToCart({
            contentIds: [productId],
            quantity,
          })

          return cartId
        }
      }

      addToLocalStorageCart(productId, quantity, denomination)
      trackMetaPixelAddToCart({
        contentIds: [productId],
        quantity,
      })
      return 'guest-cart' as Id<'carts'>
    },
    [convexUserId, user],
  )
}
