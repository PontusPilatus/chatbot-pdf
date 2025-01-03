'use client'

import { useState, useRef, useEffect } from 'react'
import FileUpload from './components/FileUpload'
import ChatMessage from './components/ChatMessage'
import { ChatMessage as ChatMessageType } from '@/types/chat'
import { v4 as uuidv4 } from 'uuid'

const TypingIndicator = () => (
  <div className="flex items-center space-x-2 p-2">
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
    <main className="min-h-screen flex flex-col items-center p-4 bg-gray-50">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-6 flex flex-col h-[calc(100vh-2rem)]">
        {/* File Upload and Active PDF Section */}
        <div className="mb-4">
          {activePDF ? (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium text-blue-900">Active PDF: {activePDF}</span>
              </div>
              <button
                onClick={() => setActivePDF(null)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Upload New PDF
              </button>
            </div>
          ) : (
            <FileUpload
              onFileProcessed={handleFileProcessed}
              onSummaryReceived={handleSummaryReceived}
            />
          )}
        </div>

        {/* Chat Section */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 scroll-smooth"
          >
            {messages.map(message => (
              message.isStreaming ? (
                <div key={message.id} className="flex justify-start mb-4">
                  <div className="bg-white rounded-lg p-2 shadow-sm max-w-[80%]">
                    <TypingIndicator />
                  </div>
                </div>
              ) : (
                <ChatMessage key={message.id} message={message} />
              )
            ))}
            {isLoading && (
              <div className="flex justify-center items-center py-4">
                <div className="animate-pulse text-gray-500">Processing...</div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t p-4 bg-white rounded-b-lg">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <textarea
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value)
                }}
                placeholder={activePDF
                  ? "Ask a question about the PDF..."
                  : "Ask me anything about my functionality..."}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] max-h-[120px] resize-y
                  text-gray-900 placeholder-gray-500 bg-white border-gray-300 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />
              <div className="flex justify-between items-center text-xs">
                <p className="text-gray-600">
                  Press Enter to send, Shift + Enter for new line
                </p>
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-4 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                    disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
