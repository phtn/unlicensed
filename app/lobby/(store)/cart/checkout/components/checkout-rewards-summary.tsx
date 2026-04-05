'use client'

import ShimmerText from '@/components/expermtl/shimmer'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {useTheme} from '@/components/ui/theme-provider'
import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatDecimalUSD} from '@/utils/currency'
import {Card} from '@heroui/react'
import {useQuery} from 'convex/react'
import {ViewTransition, memo, useState} from 'react'
import {
  type ComputedRewards,
  type RewardsCartItem,
  type RewardsConfig,
  type RewardsTier,
  REWARDS_CONFIG,
  formatRewardsCurrency,
} from '../lib/rewards'
import {MoneyFormat} from './money-format'

// ─── Sub-components ───────────────────────────────────────────────────────────

const TIER_AURA_CLASSNAME: Record<string, string> = {
  Bronze: 'bg-amber-700/12 dark:bg-amber-500/14',
  Silver: 'bg-slate-400/14 dark:bg-slate-200/12',
  Gold: 'bg-yellow-400/16 dark:bg-yellow-300/14',
  Platinum: 'bg-cyan-400/16 dark:bg-cyan-300/14',
}

const ProgressBar = memo(function ProgressBar({pct}: {pct: number}) {
  return (
    <div className='h-2 overflow-hidden rounded-full bg-foreground/5 dark:bg-foreground/20 mb-2 md:my-2.5'>
      <div
        className='h-full rounded-full bg-linear-to-r from-pink-500/80 via-pink-500/90 to-brand shadow-[0_0_8px_var(--color-brand)] transition-[width] duration-500 ease-in-out'
        style={{width: `${pct}%`}}
      />
    </div>
  )
})

const TierBadge = memo(function TierBadge({
  label,
  active,
}: {
  label: string
  active: boolean
}) {
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2.5 py-1 text-[10px] font-polysans font-semibold uppercase tracking-wider',
        active
          ? 'bg-linear-to-r bg-slate-950 text-white'
          : 'border border-foreground/20 bg-foreground/5 text-muted-foreground',
        {
          'text-slate-200/95': label === 'Silver',
          'text-yellow-200/95': label === 'Gold',
          'text-cyan-100/95': label === 'Platinum',
        },
      )}>
      {label}
    </span>
  )
})

interface FutureMilestonesProps {
  open: boolean
  onToggle: VoidFunction
  tiers: RewardsTier[]
}

const FutureMilestones = memo(function FutureMilestones({
  open,
  onToggle,
  tiers,
}: FutureMilestonesProps) {
  if (tiers.length === 0) return null

  return (
    <div className='mt-2.5 overflow-scroll'>
      <button
        type='button'
        onClick={onToggle}
        className='w-full flex items-center gap-1 border-none bg-transparent p-0 text-sm font-medium cursor-pointer'>
        <span className=''>More perks ahead! Free shipping & Cash back</span>
        <span
          className='transition-transform duration-200'
          style={{transform: open ? 'rotate(180deg)' : 'none'}}
          aria-hidden>
          ▾
        </span>
      </button>
      <ViewTransition enter='auto' exit='auto'>
        {open && (
          <div className='mt-2 flex flex-col gap-1.5 rounded-lg bg-foreground/5 p-2 md:p-3'>
            {tiers.map((t) => (
              <div
                key={t.minSubtotal}
                className='flex justify-between text-[13px] text-muted-foreground'>
                <span className='text-sm md:text-base'>
                  {t.label} {formatRewardsCurrency(t.minSubtotal)}+
                </span>
                <span className='text-sm md:text-base'>
                  {t.shippingCost === 0
                    ? 'Free shipping'
                    : `${formatRewardsCurrency(t.shippingCost)} ship`}{' '}
                  · {t.cashBackPct}% cash back
                </span>
              </div>
            ))}
          </div>
        )}
      </ViewTransition>
    </div>
  )
})

interface TopUpSuggestionsProps {
  amountNeeded: number
  suggestions: RewardsCartItem[]
  onAdd: (item: RewardsCartItem) => void
}

const TopUpSuggestions = memo(function TopUpSuggestions({
  amountNeeded,
  suggestions,
  onAdd,
}: TopUpSuggestionsProps) {
  const filtered = suggestions.filter((s) => s.price <= amountNeeded + 10)
  if (filtered.length === 0) return null

  return (
    <div className='mt-3.5'>
      <p className='mb-2 text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400'>
        ✦ Top up to unlock next reward
      </p>
      <div className='flex flex-wrap gap-2'>
        {filtered.map((sku) => (
          <button
            key={sku.id}
            type='button'
            onClick={() => onAdd(sku)}
            className='flex flex-col gap-0.5 rounded-lg border border-foreground/20 bg-foreground/5 px-3.5 py-2 text-left text-[13px] text-foreground transition-colors hover:border-amber-500/50 dark:hover:border-amber-400/50'>
            <span className='font-semibold'>{sku.name}</span>
            <span className='text-xs text-amber-600 dark:text-amber-400'>
              {formatRewardsCurrency(sku.price)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
})

// ─── Main component ───────────────────────────────────────────────────────────

export interface CheckoutRewardsSummaryProps {
  computedRewards: ComputedRewards
  config?: RewardsConfig
  /** Top-up product suggestions when near next tier; optional */
  topUpSuggestions?: RewardsCartItem[]
  onAddTopUp?: (item: RewardsCartItem) => void
}

export const CheckoutRewardsSummary = memo(function CheckoutRewardsSummary({
  computedRewards: r,
  config: configProp,
  topUpSuggestions = [],
  onAddTopUp,
}: CheckoutRewardsSummaryProps) {
  const {theme} = useTheme()
  const [isFutureMilestonesOpen, setIsFutureMilestonesOpen] = useState(false)
  const adminConfig = useQuery(api.admin.q.getRewardsConfig, {})
  const config: RewardsConfig = adminConfig ?? configProp ?? REWARDS_CONFIG
  const tierAuraClassName =
    TIER_AURA_CLASSNAME[r.currentTier.label] ??
    'bg-purple-500/10 dark:bg-purple-400/10'

  return (
    <Card className='overflow-hidden border border-foreground/20 bg-linear-to-br from-sidebar to-slate-400/6 dark:from-foreground/5 dark:to-foreground/10 transition-all duration-200 will-change-transform rounded-none'>
      <Card.Content className='relative space-y-4 p-3 md:p-5 overflow-hidden'>
        {/* Decorative glow */}
        <div
          id='tier-aura'
          className={cn(
            'pointer-events-none absolute z-800 opacity-80 -right-16 -top-16 h-64 w-64 rounded-full blur-3xl transition-colors duration-500',
            tierAuraClassName,
          )}
          aria-hidden
        />

        {/* Tier row */}
        <div className='flex items-center justify-between overflow-hidden'>
          <span className='text-base md:text-lg font-clash font-medium'>
            You&apos;re getting right now
          </span>
          <div className='flex items-center gap-1 md:gap-2 overflow-hidden'>
            <TierBadge label={r.currentTier.label} active />
            {r.isBundleBonusActive && (
              <span className='flex rounded-full bg-amber-950 dark:bg-slate-950 px-2 py-0.5 text-[11px] font-semibold text-white'>
                +0.5%{' '}
                <span className='hidden md:flex md:px-1'>Bundle Bonus</span> ✦
              </span>
            )}
          </div>
        </div>

        {/* Current benefit */}
        <div className='relative min-h-[62.01px] z-900 rounded-xl dark:bg-[#515155] bg-[#e2e3e7] p-4 overflow-hidden w-full'>
          <div className="absolute _md:max-w-500 top-0 -left-150 inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
          <div className='flex items-center justify-around'>
            <div className='text-center'>
              <div className='text-lg font-bold text-foreground dark:text-foreground'>
                {r.shippingCost === 0 ? (
                  <span className='bg-limited text-base px-1.5 uppercase rounded-sm font-bone text-dark-gray border border-dark-gray'>
                    Free
                  </span>
                ) : (
                  formatRewardsCurrency(r.shippingCost)
                )}
              </div>
              <div className='text-[11px] text-muted-foreground'>Shipping</div>
            </div>
            <div className='h-full w-px bg-foreground/20' />
            <div className='text-center'>
              <div className='text-lg font-bold text-foreground dark:text-foreground'>
                {r.cashBackPct}%
              </div>
              <div className='text-[11px] text-muted-foreground'>Cash back</div>
            </div>
            <div className='h-full w-px bg-foreground/20' />

            <div className='text-center'>
              <div className='text-lg font-bold text-foreground dark:text-foreground'>
                <AnimatedNumber
                  mass={0.1}
                  stiffness={240}
                  damping={180}
                  precision={3}
                  format={formatDecimalUSD}
                  value={r.cashBackAmount}
                />
                {/*{formatRewardsCurrency(r.cashBackAmount)}*/}
              </div>
              <div className='text-[11px] text-muted-foreground'>
                Store credit
              </div>
            </div>

            <div className='h-full w-px bg-foreground/20' />
            <div className='text-center'>
              <div className='text-lg font-bold text-foreground dark:text-foreground'>
                {r.uniqueCategories}
              </div>
              <div className='text-[11px] text-muted-foreground'>
                Categor{r.uniqueCategories === 1 ? 'y' : 'ies'}
              </div>
            </div>
          </div>
        </div>

        {/* Next milestone */}
        {r.nextTier && r.amountToNextTier !== null && (
          <div className=' '>
            <div className='flex items-baseline justify-between'>
              <span className='text-[13px] text-muted-foreground'>
                Add{' '}
                <span className='font-semibold px-1 text-foreground dark:text-foreground'>
                  <MoneyFormat value={r.amountToNextTier} />
                </span>{' '}
                to unlock:
              </span>

              <span className='text-sm w-fit pr-2'>
                <ShimmerText
                  surface='light'
                  variant='default'
                  className={cn('text-sm font-polysans uppercase', {
                    'bg-dark-table': theme === 'light',
                  })}>
                  {r.nextTier.label}
                </ShimmerText>
              </span>
            </div>
            <div className='text-sm font-semibold text-foreground/90 dark:text-foreground'>
              {r.nextTier.shippingCost === 0
                ? 'Free shipping'
                : `${formatRewardsCurrency(r.nextTier.shippingCost)} shipping`}{' '}
              + {r.nextTier.cashBackPct}% Cash back
            </div>
            <ProgressBar pct={r.progressPctToNext} />
          </div>
        )}

        {!r.nextTier && (
          <div className='py-2 text-center text-sm md:text-lg font-clash font-medium tracking-wide text-foreground dark:text-foreground'>
            ✦ Maximum Rewards Unlocked ✦
          </div>
        )}

        {/* Bundle bonus hint */}
        {!r.isBundleBonusActive && (
          <div className='flex items-center mt-0 space-x-3 rounded-lg border border-dashed border-foreground/20 bg-foreground/3 px-3 py-2 text-xs sm:text-sm text-muted-foreground'>
            <Icon
              name='lightbulb-bold'
              className='size-5 dark:text-yellow-200'
            />
            {r.isFirstOrder ? (
              <p className='mb-0 text-[11px] text-muted-foreground max-w-xl overflow-scroll'>
                Free shipping on your first order over{' '}
                {formatRewardsCurrency(config.freeShippingFirstOrder)}
              </p>
            ) : (
              <span>
                Pick from 2+ categories to earn additional 0.5% cash back
              </span>
            )}
          </div>
        )}

        <ViewTransition>
          <FutureMilestones
            open={isFutureMilestonesOpen}
            onToggle={() => setIsFutureMilestonesOpen((open) => !open)}
            tiers={r.futureTiers}
          />
        </ViewTransition>

        {r.isNearThreshold && r.amountToNextTier !== null && onAddTopUp && (
          <TopUpSuggestions
            amountNeeded={r.amountToNextTier}
            suggestions={topUpSuggestions}
            onAdd={onAddTopUp}
          />
        )}
      </Card.Content>
    </Card>
  )
})
