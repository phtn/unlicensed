// Must match convex/assistant/d.ts
export const ASSISTANT_PRO_ID = 'fire-g-001'
export const ASSISTANT_EMAIL = 'support@rapidfirenow.com'
export const ASSISTANT_NAME = 'Fire Girl'
export const ASSISTANT_AVATAR = '/svg/rf-logo-round-24-latest.svg'
export const ASSISTANT_USERNAME = 'fire-assist'

export interface AssistantMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export const isAssistantConversation = (proId: string | null): boolean => {
  return proId === ASSISTANT_PRO_ID
}
