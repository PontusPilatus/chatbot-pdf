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
import PDFViewer from './components/PDFViewer'

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
        className="h-screen w-64 flex-shrink-0"
        onSettingsChange={(settings) => {
          setShowTimestamps(settings.showTimestamps)
          setSelectedAvatar(settings.selectedAvatar)
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* PDF Viewer */}
        <PDFViewer
          url={activePDF ? `/uploads/${activePDF}` : null}
          filename={activePDF}
          className="w-1/2 border-r border-gray-200 dark:border-gray-700"
        />

        {/* Chat Area */}
        <div className="w-1/2 flex flex-col min-h-0 bg-white dark:bg-gray-800">
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
            {messages.length > 0 && (
              <button
                onClick={() => {
                  const content = convertToMarkdown(messages, activePDF)
                  const filename = `pdf-pal-chat-${new Date().toISOString().split('T')[0]}.md`
                  downloadMarkdown(content, filename)
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Download chat history"
              >
                <FiDownload className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-4"
          >
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                showTimestamp={showTimestamps}
                selectedAvatar={selectedAvatar}
              />
            ))}
            {isLoading && <TypingIndicator />}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-4">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask a question about your PDF..."
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                  dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <FiSend className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
