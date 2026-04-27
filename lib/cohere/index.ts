import type {Cohere} from 'cohere-ai'
import {CohereClientV2} from 'cohere-ai'

export type ChatMessage = Cohere.ChatMessageV2
export type Content = Cohere.Content
export type Tool = Cohere.ToolV2

let client: CohereClientV2 | null = null

export const createClient = () => {
  if (!client) {
    client = new CohereClientV2({
      token: process.env.COHERE_API_KEY,
    })
  }
  return client
}
