'use client'

import { useState, useRef, useEffect } from 'react'
import ChatMessage from './components/ChatMessage'
import { ChatMessage as ChatMessageType } from '@/types/chat'
import { v4 as uuidv4 } from 'uuid'
import Sidebar from './components/Sidebar'
import { FiSend, FiDownload } from 'react-icons/fi'
import { RiAiGenerate, RiRobotFill, RiOpenaiFill, RiRobot2Fill, RiMindMap } from 'react-icons/ri'
import { HiSparkles, HiLightBulb } from 'react-icons/hi'
import { BiBrain } from 'react-icons/bi'
import { TbBrain, TbRobot } from 'react-icons/tb'
import { IoExtensionPuzzle } from 'react-icons/io5'
import { convertToMarkdown, downloadMarkdown } from '@/utils/exportChat'

const BotAvatars = {
  RiAiGenerate,
  RiRobotFill,
  RiRobot2Fill,
  TbRobot,
  HiSparkles,
  BiBrain,
  TbBrain,
  RiMindMap,
  HiLightBulb,
  IoExtensionPuzzle,
  RiOpenaiFill,
}

const TypingIndicator = () => (
  <div className="flex items-center space-x-2 p-2">
    <div className="flex space-x-1">
      <div className="w-1.5 h-1.5 bg-gray-600 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-1.5 h-1.5 bg-gray-600 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-1.5 h-1.5 bg-gray-600 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  </div>
)

export default function Home() {
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [activePDF, setActivePDF] = useState<string | null>(null)
  const [showTimestamps, setShowTimestamps] = useState(true)
  const [selectedAvatar, setSelectedAvatar] = useState('RiAiGenerate')
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Add welcome messages sequence when component mounts
    const welcomeMessages: ChatMessageType[] = [
      {
        id: uuidv4(),
        role: 'assistant',
        content: '👋 Hi there! I\'m PDF Pal, your friendly document companion. I can help you understand and interact with your PDF documents through natural conversation!',
        timestamp: new Date().toISOString()
      },
      {
        id: uuidv4(),
        role: 'assistant',
        content: `Here's how to get started:

1️⃣ Upload a PDF using the sidebar
2️⃣ Ask questions about its content
3️⃣ Get instant, context-aware responses

💡 Pro tip: Feel free to chat in any language - English, Swedish, Spanish, German, Chinese, Arabic, or any other language! I'll automatically detect and respond in your preferred language.`,
        timestamp: new Date(Date.now() + 1500).toISOString()
      },
      {
        id: uuidv4(),
        role: 'assistant',
        content: 'Ready to begin? Upload a PDF or ask me about my features! 🚀',
        timestamp: new Date(Date.now() + 3000).toISOString()
      }
    ]

    // Add messages with a delay to simulate typing
    welcomeMessages.forEach((message, index) => {
      setTimeout(() => {
        setMessages(prev => [...prev, message])
      }, index * 1500) // 1.5 second delay between each message
    })
  }, [])

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }

  // Add effect to scroll when typing
  useEffect(() => {
    scrollToBottom()
  }, [inputMessage])

  // Add effect to scroll when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    const userMessage: ChatMessageType = {
      id: uuidv4(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    scrollToBottom()

    // Add initial assistant message for streaming
    const assistantMessageId = uuidv4()
    const assistantMessage: ChatMessageType = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true
    }
    setMessages(prev => [...prev, assistantMessage])

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputMessage,
          filename: activePDF
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Convert the chunk to text
        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')

        // Process each SSE line
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5) // Remove 'data: ' prefix
            if (data.trim() === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.error) {
                throw new Error(parsed.error)
              }
              if (parsed.chunk) {
                accumulatedContent += parsed.chunk
                // Update the message content
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: accumulatedContent }
                    : msg
                ))
                scrollToBottom()
              }
            } catch (e) {
              console.error('Error parsing chunk:', e)
            }
          }
        }
      }

      // Final update to remove streaming status
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, isStreaming: false }
          : msg
      ))

    } catch (error) {
      // Handle error
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, content: 'An error occurred. Please try again.', isStreaming: false }
          : msg
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileProcessed = (filename: string) => {
    setActivePDF(filename);
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'assistant',
      content: `I've received your PDF: ${filename}. You can now ask questions about its contents.`,
      timestamp: new Date().toISOString()
    }]);
  };

  const handleSummaryReceived = (summary: string) => {
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'assistant',
      content: `Here's a summary of the document:\n\n${summary}`,
      timestamp: new Date().toISOString()
    }]);
  };

  return (
    <main className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        activePDF={activePDF}
        onFileProcessed={handleFileProcessed}
        onSummaryReceived={handleSummaryReceived}
        className="h-screen"
        onSettingsChange={(settings) => {
          setShowTimestamps(settings.showTimestamps)
          setSelectedAvatar(settings.selectedAvatar)
        }}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-800">
        {/* Chat Header */}
        <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            {activePDF ? (
              <>
                <span className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full mr-2"></span>
                {activePDF}
              </>
            ) : (
              'General Chat'
            )}
          </h2>
          <button
            onClick={() => {
              const content = convertToMarkdown(messages, activePDF)
              const filename = `pdf-pal-chat-${new Date().toISOString().split('T')[0]}.md`
              downloadMarkdown(content, filename)
            }}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg
              transition-colors duration-200"
            title="Export chat"
          >
            <FiDownload className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto py-6 bg-white dark:bg-gray-800"
          ref={chatContainerRef}
        >
          <div className="max-w-3xl mx-auto space-y-6 px-6">
            {messages.map(message => (
              message.isStreaming ? (
                <div key={message.id} className="flex justify-start">
                  <div className="flex items-end space-x-2 max-w-[80%]">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 
                      bg-gray-600 dark:bg-gray-700 text-white">
                      {(() => {
                        const BotIcon = BotAvatars[selectedAvatar as keyof typeof BotAvatars] || RiAiGenerate
                        return <BotIcon className="w-5 h-5" />
                      })()}
                    </div>

                    {/* Typing Indicator */}
                    <div className="flex flex-col space-y-1">
                      <div className="px-4 py-3 rounded-2xl text-sm 
                        bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none">
                        <TypingIndicator />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <ChatMessage
                  key={message.id}
                  message={message}
                  showTimestamp={showTimestamps}
                  selectedAvatar={selectedAvatar}
                />
              )
            ))}
            {isLoading && (
              <div className="flex justify-center items-center py-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 
                    border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin">
                  </div>
                  <span>Processing...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={activePDF
                  ? "Ask a question about the PDF..."
                  : "Ask me anything about my functionality..."}
                className="w-full p-4 pr-24 border dark:border-gray-700 rounded-2xl focus:outline-none 
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                  min-h-[60px] max-h-[180px] resize-y 
                  bg-gray-50 dark:bg-gray-700 
                  placeholder-gray-500 dark:placeholder-gray-400 
                  text-gray-900 dark:text-gray-100"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />
              <div className="absolute right-2 bottom-2 flex items-center space-x-2">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {inputMessage.length > 0 ? `${inputMessage.length} chars` : 'Enter to send'}
                </span>
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-2 bg-blue-500 dark:bg-blue-600 text-white rounded-xl 
                    hover:bg-blue-600 dark:hover:bg-blue-700
                    disabled:bg-gray-300 dark:disabled:bg-gray-600 
                    disabled:cursor-not-allowed"
                >
                  <FiSend className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
