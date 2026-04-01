'use client'

import dynamic from 'next/dynamic'
import {useEffect, useState} from 'react'

const DynamicChatDock = dynamic(
  () => import('@/components/main/chat-dock').then((module) => module.ChatDock),
  {ssr: false},
)

export function LobbyClientChrome() {
  const [showChatDock, setShowChatDock] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(() => {
        setShowChatDock(true)
      })

      return () => {
        window.cancelIdleCallback(idleId)
      }
    }

    const timeoutId = globalThis.setTimeout(() => {
      setShowChatDock(true)
    }, 1500)

    return () => {
      globalThis.clearTimeout(timeoutId)
    }
  }, [])

  return showChatDock ? <DynamicChatDock /> : null
}
