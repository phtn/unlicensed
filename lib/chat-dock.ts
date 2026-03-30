export const CHAT_DOCK_TOGGLE_EVENT = 'hyfe_chat_dock_toggle'
export const CHAT_DOCK_OPEN_EVENT = 'hyfe_chat_dock_open'

type OpenChatDockOptions = {
  conversationFid?: string | null
}

export const toggleChatDockWindow = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(CHAT_DOCK_TOGGLE_EVENT))
}

export const openChatDockWindow = (options: OpenChatDockOptions = {}) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(CHAT_DOCK_OPEN_EVENT, {
      detail: {
        conversationFid: options.conversationFid ?? null,
      },
    }),
  )
}
