import {
  EMPTY_IPINFO_CONFIG,
  parseIpinfoConfig,
} from '@/lib/ipinfo/config'
import {describe, expect, test} from 'bun:test'

describe('parseIpinfoConfig', () => {
  test('returns defaults for invalid values', () => {
    expect(parseIpinfoConfig(null)).toEqual(EMPTY_IPINFO_CONFIG)
  })

  test('maps the legacy id field to the lite token', () => {
    expect(parseIpinfoConfig({id: 'legacy-lite-token'})).toEqual({
      enabledService: 'lite',
      lite: {token: 'legacy-lite-token'},
      core: {token: ''},
      plus: {token: ''},
      max: {token: ''},
    })
  })

  test('uses the explicit enabled service for the new config shape', () => {
    expect(
      parseIpinfoConfig({
        enabledService: 'plus',
        lite: {token: 'lite-token'},
        core: {token: 'core-token'},
        plus: {token: 'plus-token'},
        max: {token: 'max-token'},
      }),
    ).toEqual({
      enabledService: 'plus',
      lite: {token: 'lite-token'},
      core: {token: 'core-token'},
      plus: {token: 'plus-token'},
      max: {token: 'max-token'},
    })
  })
})
