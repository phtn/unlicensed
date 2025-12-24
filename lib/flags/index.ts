import {flag} from 'flags/next'

export type BuildType = 'testing' | 'debug' | 'staging' | 'production'

export const delayFlag = flag<number>({
  key: 'delay',
  defaultValue: 0,
  description:
    'A flag for debugging and demo purposes which delays the data loading',
  options: [
    {value: 0, label: 'No delay'},
    {value: 200, label: '200ms'},
    {value: 1000, label: '1s'},
    {value: 3000, label: '3s'},
    {value: 10_000, label: '10s'},
  ],
  decide() {
    return this.defaultValue as number
  },
})

export const buildTypeFlag = flag<BuildType>({
  key: 'buildType',
  defaultValue: 'production',
  description: 'The type of build environment (testing, debug, staging, production)',
  options: [
    {value: 'testing', label: 'Testing'},
    {value: 'debug', label: 'Debug'},
    {value: 'staging', label: 'Staging'},
    {value: 'production', label: 'Production'},
  ],
  decide() {
    // Check for explicit BUILD_TYPE environment variable first
    const buildType = process.env.BUILD_TYPE as BuildType | undefined
    if (buildType && ['testing', 'debug', 'staging', 'production'].includes(buildType)) {
      return buildType as BuildType
    }

    // Check VERCEL_ENV (Vercel-specific)
    const vercelEnv = process.env.VERCEL_ENV
    if (vercelEnv === 'production') {
      return 'production'
    }
    if (vercelEnv === 'preview') {
      return 'staging'
    }
    if (vercelEnv === 'development') {
      return 'debug'
    }

    // Check NODE_ENV
    const nodeEnv = process.env.NODE_ENV
    if (nodeEnv === 'production') {
      return 'production'
    }
    if (nodeEnv === 'development') {
      return 'debug'
    }
    if (nodeEnv === 'test') {
      return 'testing'
    }

    // Default to production
    return 'production'
  },
})
