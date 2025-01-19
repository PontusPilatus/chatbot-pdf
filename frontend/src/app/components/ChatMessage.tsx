'use client'

import { ChatMessage as ChatMessageType } from '@/types/chat'
import { FiUser, FiGlobe } from 'react-icons/fi'
import { RiRobotFill, RiOpenaiFill, RiRobot2Fill, RiRobotLine, RiAliensFill, RiSpaceShipFill, RiUserSmileLine, RiUserHeartLine, RiUserStarLine, RiUserSettingsLine, RiUserSearchLine, RiUserLocationLine, RiUserFollowLine, RiUserSharedLine, RiUserVoiceLine, RiEarthLine } from 'react-icons/ri'
import { HiSparkles } from 'react-icons/hi'
import { BiBrain, BiUserCircle, BiUserPin, BiUserCheck } from 'react-icons/bi'
import { TbBrain, TbRobot } from 'react-icons/tb'
import { IoRocketSharp } from 'react-icons/io5'
import { GiBrain, GiRobotGolem, GiArtificialIntelligence, GiCyberEye, GiRobotAntennas } from 'react-icons/gi'

interface ChatMessageProps {
  message: ChatMessageType
  showTimestamp?: boolean
  selectedAvatar?: string
  selectedUserAvatar?: string
  activePDF?: string | null
}

const BotAvatars = {
  GiRobotAntennas,
  RiRobotFill,
  RiRobot2Fill,
  TbRobot,
  GiRobotGolem,
  RiRobotLine,
  RiAliensFill,
  RiSpaceShipFill,
  HiSparkles,
  BiBrain,
  TbBrain,
  GiBrain,
  GiArtificialIntelligence,
  GiCyberEye,
  IoRocketSharp,
  RiOpenaiFill,
}

const UserAvatars = {
  // Row 1: Basic Users
  FiUser,
  BiUserCircle,
  RiUserSmileLine,
  RiUserHeartLine,
  // Row 2: Special Users
  RiUserStarLine,
  RiUserVoiceLine,
  RiUserSettingsLine,
  RiUserSearchLine,
  // Row 3: Action Users
  RiUserLocationLine,
  RiUserFollowLine,
  RiUserSharedLine,
  BiUserPin,
  // Row 4: Special Effects
  BiUserCheck,
  RiEarthLine,
  FiGlobe,
  HiSparkles,
}

export default function ChatMessage({ message, showTimestamp = true, selectedAvatar = 'TbRobot', selectedUserAvatar = 'FiUser', activePDF = null }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const BotIcon = BotAvatars[selectedAvatar as keyof typeof BotAvatars] || TbRobot
  const UserIcon = UserAvatars[selectedUserAvatar as keyof typeof UserAvatars] || FiUser

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-end space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse max-w-[80%]' : ''}`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200
          ${isUser
            ? 'bg-blue-500 dark:bg-blue-600 text-white'
            : 'bg-gray-600 dark:bg-gray-700 text-white'}`}>
          {isUser ? (
            <UserIcon className="w-4 h-4" />
          ) : (
            <BotIcon className="w-5 h-5" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col space-y-1 ${isUser ? 'items-end w-full' : 'items-start'}`}>
          {/* Message Bubble */}
          <div
            style={{ fontSize: 'var(--chat-font-size)' }}
            className={`px-4 py-3 rounded-2xl break-words transition-colors duration-200 min-w-[60px] whitespace-pre-wrap w-full
              ${isUser
                ? 'bg-blue-500 dark:bg-blue-600 text-white rounded-br-none'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none max-w-[85%]'}`}
          >
            {message.isStreaming ? (
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-gray-600 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-600 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-600 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            ) : (
              (message.content || '').split('\n').map((line, i) => (
                <p key={i} className={`${line.startsWith('•') ? 'ml-4' : ''} break-words`}>
                  {line}
                </p>
              ))
            )}
          </div>

          {/* Timestamp */}
          {showTimestamp && message.timestamp && (
            <span className="text-xs text-gray-400 dark:text-gray-500 px-2">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  )
} 