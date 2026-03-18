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
      radius='none'
      className='border border-foreground/20 bg-linear-to-br from-teal-500/10 via-orange-100/10 to-orange-200/10 backdrop-blur-sm dark:bg-dark-table/20'>
      <CardBody className='p-6 space-y-6'>
        <div className='flex items-center justify-between'>
          <h3 className='font-semibold font-polysans text-2xl tracking-tight'>
            Rewards
          </h3>
        </div>

        <div className='flex items-end justify-between px-4 py-4'>
          <div className=''>
            <Icon name='coins' className='size-14 dark:text-purple-100' />
          </div>
          <PointsBalance
            points={pointsBalance.availablePoints.toLocaleString()}
          />
        </div>
      </CardBody>
    </Card>
  )
}

const PointsBalance = ({points}: {points: string}) => {
  return (
    <div className='flex items-baseline gap-2'>
      <span className='text-2xl md:text-3xl font-semibold font-okxs text-white tracking-wide'>
        ${points}
      </span>
    </div>
  )
}
