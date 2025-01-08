'use client'

import { ChatMessage as ChatMessageType } from '@/types/chat'
import { FiUser, FiCpu } from 'react-icons/fi'

interface ChatMessageProps {
  message: ChatMessageType
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start space-x-2 max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200
          ${isUser
            ? 'bg-blue-500 dark:bg-blue-600 text-white'
            : 'bg-gray-600 dark:bg-gray-700 text-white'}`}>
          {isUser ? (
            <FiUser className="w-4 h-4" />
          ) : (
            <FiCpu className="w-4 h-4" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col space-y-1`}>
          <div className={`px-4 py-3 rounded-2xl text-sm transition-colors duration-200
            ${isUser
              ? 'bg-blue-500 dark:bg-blue-600 text-white rounded-br-none'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none'}`}>
            {message.content.split('\n').map((line, i) => (
              <p key={i} className={`${line.startsWith('•') ? 'ml-4' : ''} 
                ${!isUser && line.startsWith('•') ? 'text-gray-700 dark:text-gray-300' : ''}`}>
                {line}
              </p>
            ))}
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 px-2">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>
    </div>
  )
} 