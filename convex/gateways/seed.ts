import {mutation} from '../_generated/server'

const GATEWAYS = [
  {gateway: 'paygate' as const, label: 'PayGate'},
  {gateway: 'paylex' as const, label: 'Paylex'},
  {gateway: 'rampex' as const, label: 'Rampex'},
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

    for (const {gateway, label} of GATEWAYS) {
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
