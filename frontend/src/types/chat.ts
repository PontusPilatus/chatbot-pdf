export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: string
  isTyping?: boolean
}

export interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error?: string
}

export interface ChatResponse {
  answer: string
  sources?: {
    page: number
    text: string
  }[]
} 