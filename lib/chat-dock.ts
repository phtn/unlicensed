export const CHAT_DOCK_TOGGLE_EVENT = 'rapidfire_chat_dock_toggle'
export const CHAT_DOCK_OPEN_EVENT = 'rapidfire_chat_dock_open'

export type OpenChatDockOptions = {
  conversationFid?: string | null
}

export type ChatDockOpenEventDetail = {
  conversationFid: string | null
}

export type ChatDockToggleEvent = CustomEvent<void>
export type ChatDockOpenEvent = CustomEvent<ChatDockOpenEventDetail>

declare global {
  interface WindowEventMap {
    [CHAT_DOCK_TOGGLE_EVENT]: ChatDockToggleEvent
    [CHAT_DOCK_OPEN_EVENT]: ChatDockOpenEvent
  }
}

export const createToggleChatDockEvent = () =>
  new CustomEvent<void>(CHAT_DOCK_TOGGLE_EVENT)

export const createOpenChatDockEvent = (
  options: OpenChatDockOptions = {},
) =>
  new CustomEvent<ChatDockOpenEventDetail>(CHAT_DOCK_OPEN_EVENT, {
    detail: {
      conversationFid: options.conversationFid ?? null,
    },
  })

export const toggleChatDockWindow = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(createToggleChatDockEvent())
}

export const openChatDockWindow = (options: OpenChatDockOptions = {}) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(createOpenChatDockEvent(options))
}
