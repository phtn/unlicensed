export const ADMIN_ALERTS_IDENTIFIER = 'admin-alerts'

export const ADMIN_ALERT_EVENT_KEYS = [
  'orders',
  'payments',
  'signups',
  'messages',
] as const
export type AdminAlertEventKey = (typeof ADMIN_ALERT_EVENT_KEYS)[number]

export const TONE_OSCILLATORS = [
  'sine',
  'triangle',
  'square',
  'sawtooth',
] as const
export type ToneOscillator = (typeof TONE_OSCILLATORS)[number]

export const ALERT_SYNTH_TYPES = ['basic', 'glass'] as const
export type AlertSynthType = (typeof ALERT_SYNTH_TYPES)[number]

export type AdminAlertEventConfig = {
  enabled: boolean
  synthType: AlertSynthType
  waveform: ToneOscillator
  notes: string[]
  noteDurationMs: number
  gapMs: number
  volumeDb: number
}

export type AdminAlertsConfig = {
  enabled: boolean
  orders: AdminAlertEventConfig
  payments: AdminAlertEventConfig
  signups: AdminAlertEventConfig
  messages: AdminAlertEventConfig
}

const DEFAULT_EVENT_CONFIGS: Record<AdminAlertEventKey, AdminAlertEventConfig> =
  {
    orders: {
      enabled: true,
      synthType: 'basic',
      waveform: 'triangle',
      notes: ['C5', 'E5', 'G5'],
      noteDurationMs: 140,
      gapMs: 80,
      volumeDb: -10,
    },
    payments: {
      enabled: true,
      synthType: 'basic',
      waveform: 'sine',
      notes: ['G4', 'B4', 'D5', 'G5'],
      noteDurationMs: 130,
      gapMs: 70,
      volumeDb: -9,
    },
    signups: {
      enabled: true,
      synthType: 'basic',
      waveform: 'square',
      notes: ['A4', 'C5', 'E5'],
      noteDurationMs: 120,
      gapMs: 90,
      volumeDb: -12,
    },
    messages: {
      enabled: true,
      synthType: 'glass',
      waveform: 'sine',
      notes: ['G6'],
      noteDurationMs: 250,
      gapMs: 0,
      volumeDb: -14,
    },
  }

export const DEFAULT_ADMIN_ALERTS_CONFIG: AdminAlertsConfig = {
  enabled: false,
  orders: DEFAULT_EVENT_CONFIGS.orders,
  payments: DEFAULT_EVENT_CONFIGS.payments,
  signups: DEFAULT_EVENT_CONFIGS.signups,
  messages: DEFAULT_EVENT_CONFIGS.messages,
}

const clampNumber = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

const normalizeNotes = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) return fallback
  const notes = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

  return notes.length > 0 ? notes : fallback
}

export const parseNotesInput = (value: string) =>
  value
    .split(',')
    .map((note) => note.trim())
    .filter((note) => note.length > 0)

export const notesToInputValue = (notes: string[]) => notes.join(', ')

const normalizeEventConfig = (
  value: unknown,
  fallback: AdminAlertEventConfig,
): AdminAlertEventConfig => {
  const raw = value && typeof value === 'object' ? value : {}

  return {
    enabled:
      typeof (raw as {enabled?: unknown}).enabled === 'boolean'
        ? ((raw as {enabled: boolean}).enabled ?? fallback.enabled)
        : fallback.enabled,
    synthType: ALERT_SYNTH_TYPES.includes(
      (raw as {synthType?: AlertSynthType}).synthType as AlertSynthType,
    )
      ? ((raw as {synthType: AlertSynthType}).synthType ?? fallback.synthType)
      : fallback.synthType,
    waveform: TONE_OSCILLATORS.includes(
      (raw as {waveform?: ToneOscillator}).waveform as ToneOscillator,
    )
      ? ((raw as {waveform: ToneOscillator}).waveform ?? fallback.waveform)
      : fallback.waveform,
    notes: normalizeNotes((raw as {notes?: unknown}).notes, fallback.notes),
    noteDurationMs: clampNumber(
      (raw as {noteDurationMs?: unknown}).noteDurationMs,
      fallback.noteDurationMs,
      40,
      1000,
    ),
    gapMs: clampNumber(
      (raw as {gapMs?: unknown}).gapMs,
      fallback.gapMs,
      0,
      600,
    ),
    volumeDb: clampNumber(
      (raw as {volumeDb?: unknown}).volumeDb,
      fallback.volumeDb,
      -36,
      0,
    ),
  }
}

export const normalizeAdminAlertsConfig = (
  value: unknown,
): AdminAlertsConfig => {
  const raw = value && typeof value === 'object' ? value : {}

  return {
    enabled:
      typeof (raw as {enabled?: unknown}).enabled === 'boolean'
        ? ((raw as {enabled: boolean}).enabled ??
          DEFAULT_ADMIN_ALERTS_CONFIG.enabled)
        : DEFAULT_ADMIN_ALERTS_CONFIG.enabled,
    orders: normalizeEventConfig(
      (raw as {orders?: unknown}).orders,
      DEFAULT_ADMIN_ALERTS_CONFIG.orders,
    ),
    payments: normalizeEventConfig(
      (raw as {payments?: unknown}).payments,
      DEFAULT_ADMIN_ALERTS_CONFIG.payments,
    ),
    signups: normalizeEventConfig(
      (raw as {signups?: unknown}).signups,
      DEFAULT_ADMIN_ALERTS_CONFIG.signups,
    ),
    messages: normalizeEventConfig(
      (raw as {messages?: unknown}).messages,
      DEFAULT_ADMIN_ALERTS_CONFIG.messages,
    ),
  }
}

export const serializeAdminAlertsConfig = (
  config: AdminAlertsConfig,
): Record<string, unknown> => ({
  enabled: config.enabled,
  orders: config.orders,
  payments: config.payments,
  signups: config.signups,
  messages: config.messages,
})

export const playAdminAlert = async (config: AdminAlertEventConfig) => {
  if (!config.enabled || config.notes.length === 0) return

  const Tone = await import('tone')
  await Tone.start()

  if (config.synthType === 'glass') {
    const synth = new Tone.FMSynth({
      harmonicity: 8,
      modulationIndex: 12,
      oscillator: {type: 'sine'},
      envelope: {
        attack: 0.001,
        decay: 0.15,
        sustain: 0,
        release: 0.2,
      },
      modulation: {type: 'sine'},
      modulationEnvelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.15,
      },
    })
    const reverb = new Tone.Reverb({decay: 1.2, wet: 0.5}).toDestination()

    synth.volume.value = config.volumeDb
    synth.connect(reverb)

    const note = config.notes[0] ?? 'G6'
    const durationSeconds = Math.max(0.08, config.noteDurationMs / 1000)
    synth.triggerAttackRelease(note, durationSeconds)

    window.setTimeout(() => {
      synth.dispose()
      reverb.dispose()
    }, config.noteDurationMs + 500)
    return
  }

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: {type: config.waveform},
    envelope: {
      attack: 0.01,
      decay: 0.12,
      sustain: 0.08,
      release: 0.18,
    },
  }).toDestination()

  synth.volume.value = config.volumeDb

  const now = Tone.now()
  const durationSeconds = Math.max(0.04, config.noteDurationMs / 1000)
  const gapSeconds = Math.max(0, config.gapMs / 1000)

  config.notes.forEach((note, index) => {
    const time = now + index * (durationSeconds + gapSeconds)
    synth.triggerAttackRelease(note, durationSeconds, time)
  })

  const totalDurationMs =
    config.notes.length * config.noteDurationMs +
    Math.max(0, config.notes.length - 1) * config.gapMs

  window.setTimeout(() => {
    synth.dispose()
  }, totalDurationMs + 250)
}
