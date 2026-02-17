import {Icon} from '@/lib/icons'
import {Card, CardBody} from '@heroui/react'

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
  return (
    <Card
      shadow='none'
      className='border border-foreground/20 bg-linear-to-br from-teal-500/10 via-orange-100/10 to-orange-200/10 backdrop-blur-sm dark:bg-dark-table/20'>
      <CardBody className='p-6 space-y-5'>
        <div className='flex items-center justify-between'>
          <h3 className='font-semibold font-polysans text-2xl tracking-tight'>
            Rewards
          </h3>
          <div className=''>
            <Icon name='coins' className='size-20 dark:text-purple-100' />
          </div>
        </div>

        <div className='space-y-4'>
          <PointsBalance
            points={pointsBalance.availablePoints.toLocaleString()}
          />
          <NextMultiplier multiplier={2} />
          <LifetimePoints />
        </div>
      </CardBody>
    </Card>
  )
}

const PointsBalance = ({points}: {points: string}) => {
  return (
    <div className='flex items-baseline gap-2'>
      <span className='text-4xl font-medium font-space bg-linear-to-br from-black to-orange-200 dark:from-orange-400 dark:to-orange-300 bg-clip-text text-transparent'>
        {points}
      </span>
      <span className='text-base font-medium'>pts</span>
    </div>
  )
}

const NextMultiplier = ({multiplier}: {multiplier?: number}) => {
  return (
    multiplier && (
      <div className='pt-3 border-t border-default-200/50 space-y-2'>
        <div className='flex items-center justify-between'>
          <span className='text-sm text-default-600 dark:text-default-400 font-medium'>
            Next Visit Multiplier
          </span>
          <div className='dark:text-teal-300 font-semibold font-bone text-2xl'>
            {multiplier}
            <span className='text-base'>x</span>
          </div>
        </div>
      </div>
    )
  )
}

const LifetimePoints = ({points}: {points?: number}) => {
  return (
    <div className='text-xs text-default-500 pt-2 space-x-2'>
      <span>Lifetime:</span>
      <span className='font-semibold text-default-700 dark:text-default-300'>
        {points} points
      </span>
    </div>
  )
}
