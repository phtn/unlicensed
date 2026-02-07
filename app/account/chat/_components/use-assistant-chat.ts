'use client'

import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {useMutation, useQuery} from 'convex/react'
import {useCallback, useEffect, useRef, useState} from 'react'
import type {AssistantMessage} from './assistant'

interface UseAssistantChatReturn {
  messages: AssistantMessage[]
  isLoading: boolean
  isActive: boolean
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
}

export function useAssistantChat(): UseAssistantChatReturn {
  const {user} = useAuthCtx()
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState<string | null>(null)
  const streamingIdRef = useRef<string | null>(null)

  // Get assistant profile to check if active (assistant exists and is active)
  const assistantProfile = useQuery(api.assistant.q.getAssistantProfile)
  const isActive = (assistantProfile?.isActive ?? true) && assistantProfile != null

  // Get messages from Convex
  const convexMessages = useQuery(
    api.assistant.q.getAssistantMessages,
    user?.uid ? {fid: user.uid} : 'skip',
  )

  // Mutations
  const sendAssistantMessage = useMutation(api.assistant.m.sendAssistantMessage)
  const clearAssistantMessages = useMutation(
    api.assistant.m.clearAssistantMessages,
  )

  // Transform Convex messages to AssistantMessage format
  const messages: AssistantMessage[] = [
    ...(convexMessages?.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt,
    })) ?? []),
    // Add streaming message if present
    ...(streamingContent !== null && streamingIdRef.current
      ? [
          {
            id: streamingIdRef.current,
            role: 'assistant' as const,
            content: streamingContent,
            createdAt: new Date().toISOString(),
          },
        ]
      : []),
  ]

  // Clear streaming content when messages update from Convex
  useEffect(() => {
    if (convexMessages && streamingIdRef.current) {
      // Check if the streaming message has been saved to Convex
      const savedMessage = convexMessages.find(
        (msg) => msg.role === 'assistant' && msg.content === streamingContent,
      )
      if (savedMessage) {
        setStreamingContent(null)
        streamingIdRef.current = null
      }
    }
  }, [convexMessages, streamingContent])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading || !user?.uid) return

      setIsLoading(true)

      try {
        // Save user message to Convex
        await sendAssistantMessage({
          fid: user.uid,
          content: content.trim(),
          isFromAssistant: false,
        })

        // Check if assistant is active (isPublic = true)
        if (!isActive) {
          // Assistant not ready - respond with bio message
          const unavailableMessage =
            assistantProfile?.bio ||
            "I'm not ready yet. Please check back later!"
          await sendAssistantMessage({
            fid: user.uid,
            content: unavailableMessage,
            isFromAssistant: true,
          })
          return
        }

        // Start streaming response
        streamingIdRef.current = `streaming-${Date.now()}`
        setStreamingContent('')

        // Build conversation history for context (from Convex messages)
        const conversationHistory =
          convexMessages?.map((msg) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })) ?? []

        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            prompt: content.trim(),
            messages: conversationHistory,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to get response')
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        let accumulatedContent = ''

        while (true) {
          const {done, value} = await reader.read()
          if (done) break

          const text = decoder.decode(value, {stream: true})
          const lines = text.split('\n\n').filter(Boolean)

          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6)) as {
                  content?: string
                  error?: string
                }
                if (data.content) {
                  accumulatedContent += data.content
                  setStreamingContent(accumulatedContent)
                }
                if (data.error) {
                  throw new Error(data.error)
                }
              } catch (parseError) {
                // Skip malformed JSON chunks
                if (
                  parseError instanceof Error &&
                  !parseError.message.includes('Failed')
                ) {
                  console.warn('Failed to parse chunk:', line)
                }
              }
            }
          }
        }

        // Save assistant response to Convex
        if (accumulatedContent) {
          await sendAssistantMessage({
            fid: user.uid,
            content: accumulatedContent,
            isFromAssistant: true,
          })
        }

        // Clear streaming state
        setStreamingContent(null)
        streamingIdRef.current = null
      } catch (error) {
        console.error('Error sending message to assistant:', error)
        // Save error message to Convex
        await sendAssistantMessage({
          fid: user.uid,
          content: "I'm sorry, I encountered an error. Please try again later.",
          isFromAssistant: true,
        })
        setStreamingContent(null)
        streamingIdRef.current = null
      } finally {
        setIsLoading(false)
      }
    },
    [
      isLoading,
      user?.uid,
      convexMessages,
      sendAssistantMessage,
      isActive,
      assistantProfile?.bio,
    ],
  )

  const clearMessages = useCallback(async () => {
    if (!user?.uid) return
    try {
      await clearAssistantMessages({fid: user.uid})
    } catch (error) {
      console.error('Error clearing messages:', error)
    }
  }, [user?.uid, clearAssistantMessages])

  return {
    messages,
    isLoading,
    isActive,
    sendMessage,
    clearMessages,
  }
}
