'use client'

import {Icon} from '@/lib/icons'
import {Card, CardBody} from '@heroui/react'

export interface NVMultiplier {
  multiplier: number
  daysSinceLastPayment: number | null
  message: string
}

export interface PointsBalance {
  availablePoints: number
  totalPoints: number
  redeemedPoints: number
  lastPaymentDate: number | undefined
}

interface RewardsSummaryProps {
  nextVisitMultiplier: NVMultiplier | undefined
  estimatedPoints: number | null
  pointsBalance: PointsBalance | undefined
  isAuthenticated: boolean
}

export function RewardsSummary({
  nextVisitMultiplier,
  estimatedPoints,
  isAuthenticated,
}: RewardsSummaryProps) {
  return (
    <div className='lg:sticky lg:top-24 h-fit'>
      <Card
        shadow='none'
        className='dark:bg-dark-table/40 border border-foreground/40'>
        <CardBody className='space-y-4 px-8 py-5'>
          <div className='flex items-center justify-between'>
            <h2 className='text-2xl font-normal font-bone'>
              Rewards Multiplier
            </h2>
            <span className='text-4xl text-purple-700 dark:text-purple-400 font-semibold font-bone'>
              x{nextVisitMultiplier?.multiplier}
            </span>
          </div>
        </CardBody>
        {/* Estimated Points */}
        {isAuthenticated && estimatedPoints !== null && nextVisitMultiplier && (
          <>
            <div className='flex items-center justify-between text-sm p-3 bg-purple-400/10 dark:bg-purple-500/20 border-t-2 border-purple-300/20'>
              <div className='text-lg flex items-center gap-2'>
                <Icon
                  name='star-fill'
                  className='size-6 text-purple-700 dark:text-purple-400'
                />
                <span className='text-foreground tracking-tighter'>
                  Estimated Points
                </span>
              </div>
              <div className='flex items-center gap-1'>
                <span className='font-bold tracking-tight font-geist-sans text-purple-700 dark:text-purple-400 text-lg'>
                  {(estimatedPoints / 33).toFixed(0)}
                </span>
                <span className='text-sm text-foreground font-semibold'>
                  pts
                </span>
              </div>
            </div>
            {nextVisitMultiplier.message && (
              <p className='text-xs text-foreground text-center bg-purple-600/15 py-2 border-t border-purple-700/20'>
                {nextVisitMultiplier.message}
              </p>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
