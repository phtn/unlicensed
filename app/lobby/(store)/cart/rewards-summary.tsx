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
    <div className='lg:top-24 h-fit'>
      <Card
        shadow='none'
        className='dark:bg-dark-table/40 border border-foreground/20'>
        <CardBody className='space-y-4 px-4 md:px-8 py-5'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-2xl font-normal font-bone'>
                Rewards Multiplier
              </h2>
              {isAuthenticated &&
                estimatedPoints !== null &&
                nextVisitMultiplier &&
                nextVisitMultiplier?.message && (
                  <p className='text-xs text-foreground/70 font-sans pt-2'>
                    {nextVisitMultiplier.message}
                  </p>
                )}
            </div>

            <span className='text-4xl text-purple-700 dark:text-purple-400 font-semibold font-space'>
              <span className='text-2xl'>x</span>
              {nextVisitMultiplier?.multiplier}
            </span>
          </div>
        </CardBody>
        {/* Estimated Points */}
        {isAuthenticated && estimatedPoints !== null && nextVisitMultiplier && (
          <>
            <div className='relative flex items-center justify-between text-sm py-3 px-4 md:px-6 bg-purple-400/10 dark:bg-purple-500/20 border-t-2 border-purple-300/20 overflow-hidden'>
              <div className="absolute w-500 scale-x-50 top-0 -left-150 inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 scale-100 pointer-events-none" />
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
                <span className='font-bold tracking-tight font-space text-purple-700 dark:text-purple-400 text-lg'>
                  {(estimatedPoints / 33).toFixed(0)}
                </span>
                <span className='text-sm font-polysans'>pts</span>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
