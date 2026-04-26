import type Fingerprint2 from 'fingerprintjs2'

export type FingerprintComponent = Fingerprint2.Component
export type FingerprintOptions = Fingerprint2.Options

export type BrowserFingerprint = {
  visitorId: string
  components: FingerprintComponent[]
}

const DEFAULT_AUDIO_OPTIONS = {
  timeout: 1000,
  excludeIOS11: true,
} satisfies NonNullable<FingerprintOptions['audio']>

const DEFAULT_EXCLUDES = {
  adBlock: true,
  audio: true,
  doNotTrack: true,
  enumerateDevices: true,
  fontsFlash: true,
  pixelRatio: true,
} satisfies NonNullable<FingerprintOptions['excludes']>

const DEVICE_FINGERPRINT_OPTIONS = {
  excludes: {
    ...DEFAULT_EXCLUDES,
    addBehavior: true,
    fonts: true,
    indexedDb: true,
    language: true,
    localStorage: true,
    openDatabase: true,
    plugins: true,
    sessionStorage: true,
    userAgent: true,
  },
} satisfies FingerprintOptions

let cachedFingerprintPromise: Promise<BrowserFingerprint> | null = null
let cachedDeviceFingerprintPromise: Promise<BrowserFingerprint> | null = null

type Fingerprint2Module = typeof Fingerprint2 & {
  default?: typeof Fingerprint2
}

function assertBrowserRuntime() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('FingerprintJS can only run in a browser runtime.')
  }
}

function withDefaultOptions(options?: FingerprintOptions): FingerprintOptions {
  return {
    ...options,
    audio: {
      ...DEFAULT_AUDIO_OPTIONS,
      ...options?.audio,
    },
    excludes: {
      ...DEFAULT_EXCLUDES,
      ...options?.excludes,
    },
  }
}

function serializeComponentValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(serializeComponentValue).join(';')
  }

  if (value && typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }

  return String(value)
}

async function loadFingerprint2() {
  const fingerprintModule = (await import(
    'fingerprintjs2'
  )) as Fingerprint2Module

  return fingerprintModule.default ?? fingerprintModule
}

function getComponents(
  fingerprint: typeof Fingerprint2,
  options: FingerprintOptions,
) {
  return new Promise<FingerprintComponent[]>((resolve, reject) => {
    const collect = () => {
      fingerprint.getPromise(options).then(resolve).catch(reject)
    }

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(collect, {timeout: 1500})
      return
    }

    globalThis.setTimeout(collect, 0)
  })
}

async function createFingerprint(options?: FingerprintOptions) {
  assertBrowserRuntime()

  const fingerprint = await loadFingerprint2()
  const components = await getComponents(
    fingerprint,
    withDefaultOptions(options),
  )
  const componentValues = components
    .map((component) => serializeComponentValue(component.value))
    .join('~~~')

  return {
    visitorId: fingerprint.x64hash128(componentValues, 31),
    components,
  } satisfies BrowserFingerprint
}

export function getFingerprint(options?: FingerprintOptions) {
  if (options) {
    return createFingerprint(options)
  }

  cachedFingerprintPromise ??= createFingerprint().catch((error) => {
    cachedFingerprintPromise = null
    throw error
  })
  return cachedFingerprintPromise
}

export function getDeviceFingerprint() {
  cachedDeviceFingerprintPromise ??= createFingerprint(
    DEVICE_FINGERPRINT_OPTIONS,
  ).catch((error) => {
    cachedDeviceFingerprintPromise = null
    throw error
  })

  return cachedDeviceFingerprintPromise
}

export async function getFingerprintId(options?: FingerprintOptions) {
  const fingerprint = await getFingerprint(options)
  return fingerprint.visitorId
}

export async function getDeviceFingerprintId() {
  const fingerprint = await getDeviceFingerprint()
  return fingerprint.visitorId
}

export function clearFingerprintCache() {
  cachedFingerprintPromise = null
  cachedDeviceFingerprintPromise = null
}
