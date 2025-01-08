'use client'

import { useState, useRef, useEffect } from 'react'
import ChatMessage from './components/ChatMessage'
import { ChatMessage as ChatMessageType } from '@/types/chat'
import { v4 as uuidv4 } from 'uuid'
import Sidebar from './components/Sidebar'
import { FiSend } from 'react-icons/fi'

const TypingIndicator = () => (
  <div className="flex items-center space-x-2 p-2">
    <div className="flex space-x-1">
      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  </div>
)

export default function Home() {
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [activePDF, setActivePDF] = useState<string | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Add welcome message when component mounts
    const welcomeMessage: ChatMessageType = {
      id: uuidv4(),
      role: 'assistant',
      content: 'Welcome to the PDF Chatbot!\n\n' +
        '📌 Important Privacy Notice:\n' +
        '• Avoid uploading PDFs with personal, sensitive, or confidential information\n' +
        '• Your data is processed locally and not stored permanently\n' +
        '• This system complies with applicable data protection regulations\n\n' +
        '🤖 AI Disclaimer:\n' +
        '• I am an AI assistant striving for accuracy, but my responses might not always be perfect\n' +
        '• For critical matters, please verify information independently\n\n' +
        '💡 How to Use Me:\n' +
        '• Ask general questions about my features before uploading a file\n' +
        '• Upload a PDF (max size: 10MB) to ask specific questions about its content\n' +
        '• For best results, use clear and specific questions like:\n' +
        '  "What is this document about?"\n' +
        '  "Can you summarize Section 3?"\n\n' +
        'Let\'s get started! Upload a PDF when you\'re ready or ask me about my features.',
      timestamp: new Date().toISOString()
    }
    setMessages([welcomeMessage])
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
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-2 shadow-sm max-w-[80%] 
                    border border-gray-100 dark:border-gray-600">
                    <TypingIndicator />
                  </div>
                </div>
              ) : (
                <ChatMessage key={message.id} message={message} />
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
