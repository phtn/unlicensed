import {describe, expect, test} from 'bun:test'

import {
  normalizeLowStockAlertsConfig,
  resolveLowStockAlertTransition,
} from '../lib/low-stock-alerts'

describe('low stock alerts', () => {
  test('normalizes and deduplicates recipients', () => {
    const config = normalizeLowStockAlertsConfig({
      enabled: true,
      recipients: [
        {name: 'Alice', email: 'alice@example.com'},
        {name: 'Alice 2', email: ' ALICE@example.com '},
        {name: 'Bob', email: 'bob@example.com'},
        {name: 'No Email'},
      ],
    })

    expect(config).toEqual({
      enabled: true,
      recipients: [
        {name: 'Alice', email: 'alice@example.com'},
        {name: 'Bob', email: 'bob@example.com'},
      ],
    })
  })

  test('schedules once when stock falls below threshold and alerts are configured', () => {
    expect(
      resolveLowStockAlertTransition({
        threshold: 5,
        currentStock: 4,
        isActive: false,
        alertsEnabled: true,
        recipientCount: 1,
      }),
    ).toBe('schedule')
  })

  test('does not reschedule while an active alert is already open', () => {
    expect(
      resolveLowStockAlertTransition({
        threshold: 5,
        currentStock: 2,
        isActive: true,
        alertsEnabled: true,
        recipientCount: 3,
      }),
    ).toBe('noop')
  })

  test('clears the active state after stock recovers above threshold', () => {
    expect(
      resolveLowStockAlertTransition({
        threshold: 5,
        currentStock: 6,
        isActive: true,
        alertsEnabled: true,
        recipientCount: 1,
      }),
    ).toBe('clear')
  })
})
