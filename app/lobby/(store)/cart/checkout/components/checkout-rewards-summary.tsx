'use client'

import ShimmerText from '@/components/expermtl/shimmer'
import {cn} from '@/lib/utils'
import {Card, CardBody} from '@heroui/react'
import {useTheme} from 'next-themes'
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

const ProgressBar = memo(function ProgressBar({pct}: {pct: number}) {
  return (
    <div className='h-2 overflow-hidden rounded-full bg-white/80 dark:bg-foreground/20 my-2.5'>
      <div
        className='h-full rounded-full bg-linear-to-r from-brand via-brand to-brand/80 shadow-[0_0_8px_var(--color-brand)] transition-[width] duration-500 ease-[cubic-bezier(.4,0,.2,1)]'
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
  tiers: RewardsTier[]
}

const FutureMilestones = memo(function FutureMilestones({
  tiers,
}: FutureMilestonesProps) {
  const [open, setOpen] = useState(false)

  if (tiers.length === 0) return null

  const summary = tiers
    .map((t) =>
      t.shippingCost === 0
        ? `Free shipping at ${formatRewardsCurrency(t.minSubtotal)} • ${t.cashBackPct}% cash back`
        : `${t.cashBackPct}% back at ${formatRewardsCurrency(t.minSubtotal)}`,
    )
    .join('  ·  ')

  return (
    <div className='mt-2.5'>
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        className='flex items-center gap-1 border-none bg-transparent p-0 text-xs text-muted-foreground cursor-pointer'>
        <span className='max-w-[64ch] truncate'>
          More perks ahead: {summary}
        </span>
        <span
          className='transition-transform duration-200'
          style={{transform: open ? 'rotate(180deg)' : 'none'}}
          aria-hidden>
          ▾
        </span>
      </button>
      <ViewTransition>
        {open && (
          <div className='mt-2 flex flex-col gap-1.5 rounded-lg bg-foreground/5 p-3'>
            {tiers.map((t) => (
              <div
                key={t.minSubtotal}
                className='flex justify-between text-[13px] text-muted-foreground'>
                <span className='text-base'>
                  {t.label} – {formatRewardsCurrency(t.minSubtotal)}+
                </span>
                <span className='text-base'>
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
  config = REWARDS_CONFIG,
  topUpSuggestions = [],
  onAddTopUp,
}: CheckoutRewardsSummaryProps) {
  const {theme} = useTheme()
  return (
    <Card
      shadow='none'
      className='overflow-hidden border border-foreground/20 bg-gradient-to-br from-sidebar to-slate-400/[0.06] dark:from-foreground/5 dark:to-foreground/10'>
      <CardBody className='relative space-y-4 p-5'>
        {/* Decorative glow */}
        <div
          className='pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-purple-500/10 dark:bg-purple-400/10 blur-xl'
          aria-hidden
        />

        {/* Tier row */}
        <div className='flex items-center justify-between'>
          <span className='text-[13px] opacity-80'>
            You&apos;re getting right now
          </span>
          <div className='flex items-center gap-1 md:gap-2'>
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
        <div className='relative rounded-xl bg-foreground/5 p-4 overflow-hidden'>
          <div className="absolute w-500 scale-x-50 top-0 -left-150 inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 scale-100 pointer-events-none" />
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
              <div className='text-[11px] text-muted-foreground'>
                {r.isFirstOrder && r.shippingCost === 0
                  ? 'discreet shipping*'
                  : 'Shipping'}
              </div>
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
                {formatRewardsCurrency(r.cashBackAmount)}
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
          <div>
            <div className='flex items-baseline justify-between'>
              <span className='text-[13px] text-muted-foreground'>
                Add{' '}
                <span className='font-semibold px-1 text-foreground dark:text-foreground'>
                  <MoneyFormat value={r.amountToNextTier} />
                </span>{' '}
                to unlock:
              </span>

              <span className='text-sm'>
                <ShimmerText
                  surface='light'
                  variant='default'
                  className={cn('text-base', {
                    'bg-dark-table': theme === 'light',
                  })}>
                  {r.nextTier.label}
                </ShimmerText>
              </span>
            </div>
            <ProgressBar pct={r.progressPctToNext} />
            <div className='flex items-center gap-3 text-[13px] font-bold text-foreground dark:text-foreground'>
              <span>
                {r.nextTier.shippingCost === 0
                  ? '✦ Free shipping'
                  : `✦ ${formatRewardsCurrency(r.nextTier.shippingCost)} shipping`}
              </span>
              <span>+</span>
              <span>
                {r.nextTier.cashBackPct}% <span className=''>Cash back</span>
              </span>
            </div>
          </div>
        )}

        {!r.nextTier && (
          <div className='py-2 text-center text-sm font-polysans font-medium tracking-wide text-foreground dark:text-foreground'>
            ✦ Maximum Rewards Unlocked ✦
          </div>
        )}

        {/* Bundle bonus hint */}
        {!r.isBundleBonusActive && (
          <div className='mt-3 rounded-lg border border-dashed border-foreground/20 bg-foreground/[0.03] px-3 py-2 text-xs text-muted-foreground'>
            💡 Add items from 2+ categories to earn +0.5% bundle bonus
          </div>
        )}

        <FutureMilestones tiers={r.futureTiers} />

        {r.isNearThreshold && r.amountToNextTier !== null && onAddTopUp && (
          <TopUpSuggestions
            amountNeeded={r.amountToNextTier}
            suggestions={topUpSuggestions}
            onAdd={onAddTopUp}
          />
        )}

        {r.isFirstOrder && (
          <p className='mt-3.5 mb-0 text-[11px] text-muted-foreground/80'>
            * First order: free discreet shipping on orders over{' '}
            {formatRewardsCurrency(config.freeShippingFirstOrder)}. Min.
            redemption: {formatRewardsCurrency(config.minRedemption)} store
            credit.
          </p>
        )}
      </CardBody>
    </Card>
  )
})
