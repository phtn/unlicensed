import {Icon} from '@/lib/icons'
import {Card} from '@heroui/react'

interface RewardPointsBalance {
  availablePoints: number
  totalPoints: number
  redeemedPoints: number
  lastPaymentDate?: number
}

interface RewardPointsProps {
  pointsBalance: RewardPointsBalance
}

export const RewardPoints = ({pointsBalance}: RewardPointsProps) => {
  const {availablePoints, totalPoints, redeemedPoints} = pointsBalance

  return (
    <Card className='rounded-xs border border-foreground/10 bg-linear-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 shadow-none dark:bg-dark-table/20'>
      <Card.Content className='space-y-4 p-5'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <span className='font-okxs text-[9px] uppercase tracking-widest text-default-400'>
            Rewards
          </span>
          <Icon name='coins' className='size-3.5 text-default-300' />
        </div>

        {/* Balance */}
        <div className='flex items-baseline gap-1.5'>
          <span className='font-clash text-3xl leading-none tracking-tight'>
            ${availablePoints.toLocaleString()}
          </span>
        </div>

        {/* Breakdown */}
        <div className='grid grid-cols-2 gap-3 border-t border-foreground/8 pt-3 dark:border-foreground/10'>
          <div>
            <p className='font-okxs text-[9px] uppercase tracking-widest text-default-400'>
              Total Earned
            </p>
            <p className='mt-0.5 font-clash font-medium text-sm tracking-wider'>
              ${totalPoints.toLocaleString()}
            </p>
          </div>
          <div>
            <p className='font-okxs text-[9px] uppercase tracking-widest text-default-400'>
              Redeemed
            </p>
            <p className='mt-0.5 font-clash font-medium text-sm tracking-wider'>
              ${redeemedPoints.toLocaleString()}
            </p>
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}
