import type {Doc} from '@/convex/_generated/dataModel'
import type {EmailSettingsFormValues} from './email-settings-form-schema'

type EmailSettingsDoc = Doc<'emailSettings'>

export const defaultFormValues: EmailSettingsFormValues = {
  title: 'Hi',
  intent: 'activation',
  visible: true,
  type: 'transactional',
  group: 'activation',
  from: 'support@rapidfirenow.com',
  to: 'phtn458@gmail.com',
  cc: '',
  bcc: '',
  subject: 'test',
  text: '',
  body: '',
  html: '',
}

export const withViewTransition = (fn: () => void) => {
  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => unknown
  }
  if (typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(() => {
      fn()
    })
    return
  }
  fn()
}

export const toFormValues = (
  setting?: EmailSettingsDoc | null,
): EmailSettingsFormValues => {
  if (!setting) return defaultFormValues

  return {
    title: setting.title ?? '',
    intent: setting.intent ?? '',
    visible: setting.visible ?? true,
    type: setting.type ?? 'transactional',
    group: setting.group ?? '',
    from: (setting.from ?? []).join(', '),
    to: (setting.to ?? []).join(', '),
    cc: (setting.cc ?? []).join(', '),
    bcc: (setting.bcc ?? []).join(', '),
    subject: setting.subject ?? '',
    text: setting.text ?? '',
    body: setting.body ?? '',
    html: setting.html ?? '',
  }
}
