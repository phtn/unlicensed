import {getDeviceFingerprint, getFingerprint} from '@/lib/fingerprintjs2'

export type DeviceProfile = {
  userAgent: string
  cores: number | null
  screen: {
    width: number
    height: number
    pixelRatio: number
  }
  hasTouch: boolean
  timezone: string
  canvasFingerprint: string
  webglVendor?:
    | {
        vendor: string
        renderer: string
      }
    | 'unavailable'
    | 'not-supported'
      | 'error'
  fingerprintId: string
  deviceFingerprintId: string
}

export async function getDeviceProfile(ref: HTMLCanvasElement | null) {
  if (typeof window === 'undefined') {
    throw new Error('Device profile collection must run in the browser.')
  }

  const userAgent = navigator.userAgent
  const cores = navigator.hardwareConcurrency
  const screenWidth = window.screen.width
  const screenHeight = window.screen.height
  const pixelRatio = window.devicePixelRatio || 1
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  const canvasFingerprint = getCanvasFingerprint(ref)
  const [fingerprint, deviceFingerprint] = await Promise.all([
    getFingerprint(),
    getDeviceFingerprint(),
  ])

  const results = {
    userAgent,
    cores,
    screen: {
      width: screenWidth,
      height: screenHeight,
      pixelRatio,
    },
    hasTouch,
    timezone,
    canvasFingerprint,
    fingerprintId: fingerprint.visitorId,
    deviceFingerprintId: deviceFingerprint.visitorId,
  } satisfies DeviceProfile

  return results
}

function getCanvasFingerprint(canvasRef: HTMLCanvasElement | null) {
  if (!canvasRef) return 'not-supported'
  try {
    const ctx = canvasRef.getContext('2d') as CanvasRenderingContext2D
    ctx.textBaseline = 'top'
    ctx.font = "14px 'Arial'"
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('Hello, 🍪!', 2, 15)
    return canvasRef.toDataURL()
  } catch (err) {
    console.log(err)
    return 'not-supported'
  }
}
