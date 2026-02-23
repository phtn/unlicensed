import {useMemo, useState} from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartItem {
  id: string
  name: string
  price: number
  category: string
  isHighMargin?: boolean
}

interface RewardsTier {
  minSubtotal: number
  maxSubtotal: number | null
  shippingCost: number
  cashBackPct: number
  label: string
}

interface BundleBonus {
  enabled: boolean
  bonusPct: number
  minCategories: number
}

interface RewardsConfig {
  tiers: RewardsTier[]
  bundleBonus: BundleBonus
  freeShippingFirstOrder: number
  minRedemption: number
  topUpProximityThreshold: number
}

interface ComputedRewards {
  currentTier: RewardsTier
  nextTier: RewardsTier | null
  futureTiers: RewardsTier[]
  cashBackPct: number
  shippingCost: number
  cashBackAmount: number
  isBundleBonusActive: boolean
  uniqueCategories: number
  amountToNextTier: number | null
  progressPctToNext: number
  isNearThreshold: boolean
  isFirstOrder: boolean
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CONFIG: RewardsConfig = {
  tiers: [
    {
      minSubtotal: 0,
      maxSubtotal: 98.99,
      shippingCost: 14.95,
      cashBackPct: 1.5,
      label: 'Starter',
    },
    {
      minSubtotal: 99,
      maxSubtotal: 148.99,
      shippingCost: 4.99,
      cashBackPct: 2.0,
      label: 'Silver',
    },
    {
      minSubtotal: 149,
      maxSubtotal: 248.99,
      shippingCost: 0,
      cashBackPct: 3.0,
      label: 'Gold',
    },
    {
      minSubtotal: 249,
      maxSubtotal: null,
      shippingCost: 0,
      cashBackPct: 5.0,
      label: 'Platinum',
    },
  ],
  bundleBonus: {enabled: true, bonusPct: 0.5, minCategories: 2},
  freeShippingFirstOrder: 49,
  minRedemption: 5,
  topUpProximityThreshold: 20,
}

// ─── Pure logic ───────────────────────────────────────────────────────────────

function computeRewards(
  items: CartItem[],
  subtotal: number,
  isFirstOrder: boolean,
  config: RewardsConfig,
): ComputedRewards {
  const tierIdx = config.tiers.findIndex(
    (t) =>
      subtotal >= t.minSubtotal &&
      (t.maxSubtotal === null || subtotal <= t.maxSubtotal),
  )
  const currentTier = config.tiers[tierIdx] ?? config.tiers[0]
  const nextTier =
    tierIdx < config.tiers.length - 1 ? config.tiers[tierIdx + 1] : null
  const futureTiers =
    tierIdx < config.tiers.length - 2 ? config.tiers.slice(tierIdx + 2) : []

  const uniqueCategories = new Set(items.map((i) => i.category)).size
  const isBundleBonusActive =
    config.bundleBonus.enabled &&
    uniqueCategories >= config.bundleBonus.minCategories

  const cashBackPct =
    currentTier.cashBackPct +
    (isBundleBonusActive ? config.bundleBonus.bonusPct : 0)
  const cashBackAmount = (subtotal * cashBackPct) / 100

  let shippingCost = currentTier.shippingCost
  if (isFirstOrder && subtotal >= config.freeShippingFirstOrder)
    shippingCost = 0

  const amountToNextTier = nextTier
    ? Math.max(0, nextTier.minSubtotal - subtotal)
    : null

  const tierSpan = nextTier ? nextTier.minSubtotal - currentTier.minSubtotal : 1
  const progressInTier = subtotal - currentTier.minSubtotal
  const progressPctToNext = nextTier
    ? Math.min(100, (progressInTier / tierSpan) * 100)
    : 100

  const isNearThreshold =
    amountToNextTier !== null &&
    amountToNextTier <= config.topUpProximityThreshold

  return {
    currentTier,
    nextTier,
    futureTiers,
    cashBackPct,
    shippingCost,
    cashBackAmount,
    isBundleBonusActive,
    uniqueCategories,
    amountToNextTier,
    progressPctToNext,
    isNearThreshold,
    isFirstOrder,
  }
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

const SAMPLE_TOP_UP_SKUS: CartItem[] = [
  {
    id: 't1',
    name: 'Travel Kit',
    price: 18.99,
    category: 'Accessories',
    isHighMargin: true,
  },
  {
    id: 't2',
    name: 'Pocket Balm Duo',
    price: 12.95,
    category: 'Skincare',
    isHighMargin: true,
  },
  {
    id: 't3',
    name: 'Sample Bundle',
    price: 9.99,
    category: 'Samples',
    isHighMargin: true,
  },
]

const DEFAULT_ITEMS: CartItem[] = [
  {id: '1', name: 'Daily Moisturizer', price: 42.0, category: 'Skincare'},
  {id: '2', name: 'Vitamin C Serum', price: 38.0, category: 'Skincare'},
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('en-US', {style: 'currency', currency: 'USD'})
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({pct}: {pct: number}) {
  return (
    <div
      style={{
        background: '#1a1a2e',
        borderRadius: 99,
        height: 8,
        overflow: 'hidden',
        margin: '10px 0',
      }}>
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #c8a96e, #f0d090)',
          borderRadius: 99,
          transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
          boxShadow: '0 0 8px #c8a96e88',
        }}
      />
    </div>
  )
}

function TierBadge({label, active}: {label: string; active: boolean}) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        background: active
          ? 'linear-gradient(90deg, #c8a96e, #f0d090)'
          : '#2a2a3e',
        color: active ? '#12121e' : '#6b6b8a',
        border: active ? 'none' : '1px solid #3a3a5a',
      }}>
      {label}
    </span>
  )
}

interface FutureMilestonesProps {
  tiers: RewardsTier[]
}
function FutureMilestones({tiers}: FutureMilestonesProps) {
  const [open, setOpen] = useState(false)
  if (tiers.length === 0) return null
  const summary = tiers
    .map((t) =>
      t.shippingCost === 0
        ? `Free shipping at ${fmt(t.minSubtotal)} • ${t.cashBackPct}% back`
        : `${t.cashBackPct}% back at ${fmt(t.minSubtotal)}`,
    )
    .join('  ·  ')

  return (
    <div style={{marginTop: 10}}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: 'none',
          border: 'none',
          color: '#6b6b8a',
          fontSize: 12,
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
        <span>More perks ahead: {summary}</span>
        <span
          style={{
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'none',
          }}>
          ▾
        </span>
      </button>
      {open && (
        <div
          style={{
            marginTop: 8,
            padding: '10px 14px',
            background: '#1a1a2e',
            borderRadius: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}>
          {tiers.map((t) => (
            <div
              key={t.minSubtotal}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
                color: '#9090b0',
              }}>
              <span>
                {t.label} – {fmt(t.minSubtotal)}+
              </span>
              <span>
                {t.shippingCost === 0
                  ? 'Free ship'
                  : fmt(t.shippingCost) + ' ship'}{' '}
                · {t.cashBackPct}% back
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface TopUpSuggestionsProps {
  amountNeeded: number
  onAdd: (item: CartItem) => void
}
function TopUpSuggestions({amountNeeded, onAdd}: TopUpSuggestionsProps) {
  const suggestions = SAMPLE_TOP_UP_SKUS.filter(
    (s) => s.price <= amountNeeded + 10,
  )
  if (suggestions.length === 0) return null
  return (
    <div style={{marginTop: 14}}>
      <p
        style={{
          fontSize: 12,
          color: '#c8a96e',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
        ✦ Top up to unlock next reward
      </p>
      <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
        {suggestions.map((sku) => (
          <button
            key={sku.id}
            onClick={() => onAdd(sku)}
            style={{
              background: '#1a1a2e',
              border: '1px solid #3a3a5a',
              borderRadius: 10,
              padding: '8px 14px',
              color: '#e0e0f0',
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              textAlign: 'left',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = '#c8a96e')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = '#3a3a5a')
            }>
            <span style={{fontWeight: 600}}>{sku.name}</span>
            <span style={{color: '#c8a96e', fontSize: 12}}>
              {fmt(sku.price)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RewardsCart() {
  const [items, setItems] = useState<CartItem[]>(DEFAULT_ITEMS)
  const [isFirstOrder, setIsFirstOrder] = useState(true)
  const [manualSubtotal, setManualSubtotal] = useState<number | null>(null)

  const subtotal = useMemo(
    () => manualSubtotal ?? items.reduce((s, i) => s + i.price, 0),
    [items, manualSubtotal],
  )

  const r = useMemo(
    () => computeRewards(items, subtotal, isFirstOrder, CONFIG),
    [items, subtotal, isFirstOrder],
  )

  const addItem = (item: CartItem) => {
    setItems((prev) => [...prev, {...item, id: item.id + Date.now()}])
    setManualSubtotal(null)
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    setManualSubtotal(null)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0d0d1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'DM Serif Display', 'Georgia', serif",
        padding: '24px 16px',
      }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>

      <div
        style={{
          width: '100%',
          maxWidth: 480,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
        {/* Header */}
        <div style={{textAlign: 'center', marginBottom: 4}}>
          <h1
            style={{
              color: '#f0d090',
              margin: 0,
              fontSize: 28,
              letterSpacing: '-0.01em',
            }}>
            Your Cart
          </h1>
          <p
            style={{
              color: '#6b6b8a',
              fontSize: 13,
              margin: '4px 0 0',
              fontFamily: "'DM Sans', sans-serif",
            }}>
            Earn cash back · Unlock free shipping
          </p>
        </div>

        {/* Cart Items */}
        <div
          style={{
            background: '#12121e',
            borderRadius: 16,
            border: '1px solid #2a2a3e',
            overflow: 'hidden',
          }}>
          <div
            style={{padding: '14px 18px', borderBottom: '1px solid #1e1e30'}}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#6b6b8a',
                textTransform: 'uppercase',
                fontFamily: "'DM Sans', sans-serif",
              }}>
              Items ({items.length})
            </span>
          </div>
          {items.length === 0 && (
            <div
              style={{
                padding: '20px 18px',
                color: '#6b6b8a',
                fontSize: 14,
                textAlign: 'center',
                fontFamily: "'DM Sans', sans-serif",
              }}>
              Your cart is empty
            </div>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderBottom: '1px solid #1a1a2e',
                fontFamily: "'DM Sans', sans-serif",
              }}>
              <div>
                <div style={{color: '#e0e0f0', fontSize: 14, fontWeight: 500}}>
                  {item.name}
                </div>
                <div style={{color: '#6b6b8a', fontSize: 12}}>
                  {item.category}
                </div>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                <span style={{color: '#c8a96e', fontWeight: 700, fontSize: 15}}>
                  {fmt(item.price)}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4a4a6a',
                    cursor: 'pointer',
                    fontSize: 16,
                    padding: 0,
                    lineHeight: 1,
                  }}>
                  ×
                </button>
              </div>
            </div>
          ))}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '14px 18px',
              fontFamily: "'DM Sans', sans-serif",
            }}>
            <span style={{color: '#9090b0', fontSize: 14}}>Subtotal</span>
            <span style={{color: '#f0d090', fontWeight: 700, fontSize: 16}}>
              {fmt(subtotal)}
            </span>
          </div>
        </div>

        {/* Subtotal Scrubber (demo) */}
        <div
          style={{
            background: '#12121e',
            borderRadius: 16,
            border: '1px solid #2a2a3e',
            padding: '14px 18px',
            fontFamily: "'DM Sans', sans-serif",
          }}>
          <label
            style={{
              fontSize: 12,
              color: '#6b6b8a',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 8,
            }}>
            Demo — Drag to simulate subtotal
          </label>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <input
              type='range'
              min={0}
              max={300}
              step={1}
              value={manualSubtotal ?? subtotal}
              onChange={(e) => setManualSubtotal(Number(e.target.value))}
              style={{flex: 1, accentColor: '#c8a96e'}}
            />
            <span
              style={{
                color: '#c8a96e',
                fontWeight: 700,
                minWidth: 58,
                textAlign: 'right',
              }}>
              {fmt(manualSubtotal ?? subtotal)}
            </span>
          </div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 10,
              cursor: 'pointer',
              fontSize: 13,
              color: '#9090b0',
            }}>
            <input
              type='checkbox'
              checked={isFirstOrder}
              onChange={(e) => setIsFirstOrder(e.target.checked)}
              style={{accentColor: '#c8a96e'}}
            />
            First-time customer
          </label>
        </div>

        {/* Rewards Progress Panel */}
        <div
          style={{
            background: 'linear-gradient(135deg, #14142a 0%, #1a1030 100%)',
            borderRadius: 16,
            border: '1px solid #2e2a50',
            padding: '20px 22px',
            position: 'relative',
            overflow: 'hidden',
          }}>
          {/* decorative glow */}
          <div
            style={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 160,
              height: 160,
              background:
                'radial-gradient(circle, #c8a96e22 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Tier row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <TierBadge label={r.currentTier.label} active />
              {r.isBundleBonusActive && (
                <span
                  style={{
                    fontSize: 11,
                    color: '#f0d090',
                    background: '#2a1e10',
                    padding: '2px 8px',
                    borderRadius: 99,
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                  }}>
                  +0.5% Bundle Bonus ✦
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: 13,
                color: '#9090b0',
                fontFamily: "'DM Sans', sans-serif",
              }}>
              {r.uniqueCategories} categor
              {r.uniqueCategories === 1 ? 'y' : 'ies'}
            </span>
          </div>

          {/* Current benefit */}
          <div
            style={{
              background: '#1e1e34',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 14,
              fontFamily: "'DM Sans', sans-serif",
            }}>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: '#6b6b8a',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontWeight: 700,
                marginBottom: 6,
              }}>
              You&apos;re getting right now
            </p>
            <div style={{display: 'flex', gap: 18}}>
              <div>
                <div style={{color: '#f0d090', fontWeight: 700, fontSize: 18}}>
                  {r.shippingCost === 0 ? 'Free' : fmt(r.shippingCost)}
                </div>
                <div style={{color: '#6b6b8a', fontSize: 11}}>
                  {r.isFirstOrder && r.shippingCost === 0
                    ? 'discreet shipping*'
                    : 'shipping'}
                </div>
              </div>
              <div style={{width: 1, background: '#2a2a40'}} />
              <div>
                <div style={{color: '#f0d090', fontWeight: 700, fontSize: 18}}>
                  {r.cashBackPct}%
                </div>
                <div style={{color: '#6b6b8a', fontSize: 11}}>cash back</div>
              </div>
              <div style={{width: 1, background: '#2a2a40'}} />
              <div>
                <div style={{color: '#c8a96e', fontWeight: 700, fontSize: 18}}>
                  {fmt(r.cashBackAmount)}
                </div>
                <div style={{color: '#6b6b8a', fontSize: 11}}>store credit</div>
              </div>
            </div>
          </div>

          {/* Next milestone */}
          {r.nextTier && r.amountToNextTier !== null && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                <span style={{fontSize: 13, color: '#9090b0'}}>
                  Add{' '}
                  <span style={{color: '#f0d090', fontWeight: 700}}>
                    {fmt(r.amountToNextTier)}
                  </span>{' '}
                  to unlock:
                </span>
                <span style={{fontSize: 12, color: '#6b6b8a'}}>
                  {r.nextTier.label}
                </span>
              </div>

              <ProgressBar pct={r.progressPctToNext} />

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: '#c8a96e',
                  fontWeight: 600,
                }}>
                <span>
                  {r.nextTier.shippingCost === 0
                    ? '✦ Free shipping'
                    : `✦ ${fmt(r.nextTier.shippingCost)} shipping`}
                </span>
                <span>+</span>
                <span>{r.nextTier.cashBackPct}% cash back</span>
              </div>
            </div>
          )}

          {!r.nextTier && (
            <div
              style={{
                textAlign: 'center',
                padding: '8px 0',
                color: '#c8a96e',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}>
              ✦ Maximum rewards unlocked ✦
            </div>
          )}

          {/* Bundle bonus hint */}
          {!r.isBundleBonusActive && (
            <div
              style={{
                marginTop: 12,
                padding: '8px 12px',
                background: '#1a1020',
                borderRadius: 8,
                fontSize: 12,
                color: '#9090b0',
                fontFamily: "'DM Sans', sans-serif",
                border: '1px dashed #3a2a50',
              }}>
              💡 Add items from 2+ categories to earn +0.5% bundle bonus
            </div>
          )}

          {/* Future milestones */}
          <FutureMilestones tiers={r.futureTiers} />

          {/* Top-up suggestions */}
          {r.isNearThreshold && r.amountToNextTier !== null && (
            <TopUpSuggestions
              amountNeeded={r.amountToNextTier}
              onAdd={addItem}
            />
          )}

          {/* First order note */}
          {r.isFirstOrder && (
            <p
              style={{
                marginTop: 14,
                marginBottom: 0,
                fontSize: 11,
                color: '#4a4a6a',
                fontFamily: "'DM Sans', sans-serif",
              }}>
              * First order: free discreet shipping on orders over{' '}
              {fmt(CONFIG.freeShippingFirstOrder)}. Min. redemption:{' '}
              {fmt(CONFIG.minRedemption)} store credit.
            </p>
          )}
        </div>

        {/* Summary row */}
        <div
          style={{
            background: '#12121e',
            borderRadius: 16,
            border: '1px solid #2a2a3e',
            padding: '16px 22px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: "'DM Sans', sans-serif",
          }}>
          <div>
            <div style={{fontSize: 12, color: '#6b6b8a', marginBottom: 2}}>
              Order Total
            </div>
            <div style={{color: '#f0d090', fontWeight: 700, fontSize: 22}}>
              {fmt(subtotal + r.shippingCost)}
            </div>
          </div>
          <button
            style={{
              background: 'linear-gradient(135deg, #c8a96e, #f0d090)',
              border: 'none',
              borderRadius: 12,
              padding: '12px 24px',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              color: '#0d0d1a',
              letterSpacing: '0.02em',
            }}>
            Checkout →
          </button>
        </div>
      </div>
    </div>
  )
}
