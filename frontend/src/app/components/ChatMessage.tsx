'use client'

import type { ChatMessage } from '@/types/chat'
import { FiUser } from 'react-icons/fi'
import { RiRobot2Line } from 'react-icons/ri'

interface Props {
  message: ChatMessage
}

const TypingIndicator = () => (
  <div className="flex items-center space-x-2">
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  </div>
)

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 ${isUser ? 'ml-2' : 'mr-2'}`}>
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <FiUser className="text-white" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
              <RiRobot2Line className="text-white" />
            </div>
          )}
        </div>
        <div
          className={`rounded-lg p-3 ${isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-900'
            }`}
        >
          {message.isStreaming ? (
            <>
              <div className="whitespace-pre-wrap mb-1">{message.content}</div>
              <TypingIndicator />
            </>
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </div>
      </div>
    </div>
  )
} 