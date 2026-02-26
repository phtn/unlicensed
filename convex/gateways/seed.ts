import {mutation} from '../_generated/server'

const GATEWAYS = [
  {
    gateway: 'paygate' as const,
    label: 'PayGate',
    apiUrl: 'https://api.paygate.to',
    checkoutUrl: 'https://checkout.paygate.to',
  },
  {
    gateway: 'paylex' as const,
    label: 'Paylex',
    apiUrl: 'https://api.paylex.org',
    checkoutUrl: 'https://checkout.paylex.org',
  },
  {
    gateway: 'rampex' as const,
    label: 'Rampex',
    apiUrl: 'https://api.rampex.io',
    checkoutUrl: 'https://checkout.rampex.io',
  },
]

/**
 * Seed the gateways table with paygate, paylex, and rampex.
 * Safe to call multiple times - will not duplicate.
 */
export const seedGateways = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const inserted: string[] = []
    const skipped: string[] = []

    for (const {gateway, label, apiUrl, checkoutUrl} of GATEWAYS) {
      const existing = await ctx.db
        .query('gateways')
        .withIndex('by_gateway', (q) => q.eq('gateway', gateway))
        .first()

      if (existing) {
        skipped.push(gateway)
        continue
      }

      await ctx.db.insert('gateways', {
        gateway,
        label,
        enabled: true,
        createdAt: now,
        updatedAt: now,
        apiUrl,
        checkoutUrl,
      })
      inserted.push(gateway)
    }

    return {
      success: true,
      inserted,
      skipped,
      message:
        inserted.length > 0
          ? `Inserted: ${inserted.join(', ')}`
          : 'All gateways already exist',
    }
  },
})
