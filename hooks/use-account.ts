import {api} from '@/convex/_generated/api'
import {useQuery} from 'convex/react'
import {useAuth} from './use-auth'

export const useAccount = () => {
  const {user: firebaseUser} = useAuth()

  // 1. Get Current User
  const convexUser = useQuery(
    api.users.q.getCurrentUser,
    firebaseUser ? {firebaseId: firebaseUser.uid} : 'skip',
  )

  const userId = convexUser?._id

  const orderStats = useQuery(
    api.orders.q.getUserOrderStats,
    userId ? {userId} : 'skip',
  )

  const rewards = useQuery(
    api.rewards.q.getUserRewards,
    userId ? {userId} : 'skip',
  )

  const orders = useQuery(
    api.orders.q.getUserOrders,
    userId ? {userId, limit: 8} : 'skip',
  )

  const tierBenefits = useQuery(
    api.rewards.q.getUserTierBenefits,
    userId ? {userId} : 'skip',
  )

  const pointsBalance = useQuery(
    api.rewards.q.getUserPointsBalance,
    userId ? {userId} : 'skip',
  )

  const nextVisitMultiplier = useQuery(
    api.rewards.q.getNextVisitMultiplier,
    userId ? {userId} : 'skip',
  )

  return {
    user: convexUser,
    orderStats,
    rewards,
    tierBenefits,
    pointsBalance,
    nextVisitMultiplier,
    orders,
  }
}
