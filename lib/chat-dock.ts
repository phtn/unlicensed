export const CHAT_DOCK_TOGGLE_EVENT = 'hyfe_chat_dock_toggle'

export const toggleChatDockWindow = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(CHAT_DOCK_TOGGLE_EVENT))
}
