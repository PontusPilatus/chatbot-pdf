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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Add welcome message when component mounts
    const welcomeMessage: ChatMessageType = {
      id: uuidv4(),
      role: 'assistant',
      content: 'Welcome! I am a PDF chatbot.\n\n' +
        'Important Privacy Notice:\n' +
        '• Do not upload PDFs containing personal, sensitive, or confidential information\n' +
        '• All data is processed locally and not stored permanently\n' +
        '• This system is designed to comply with applicable data protection regulations\n\n' +
        'AI Disclaimer:\n' +
        '• I am an AI-powered assistant, and while I strive for accuracy, my responses may not always be perfect\n' +
        '• For critical information, please verify independently\n\n' +
        'Usage Tips:\n' +
        '• You can ask me general questions about my functionality before uploading a PDF\n' +
        '• After uploading a PDF (maximum size: 10MB), I can answer specific questions about its content\n' +
        '• For best results, ask clear and specific questions\n' +
        '• Example: "What can you help me with?" or "How do you process PDFs?"\n' +
        '• You can upload a PDF file in the box above when ready',
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

    // Add optimistic typing indicator
    const typingIndicatorId = uuidv4()
    setMessages(prev => [...prev, {
      id: typingIndicatorId,
      role: 'assistant',
      content: '...',
      timestamp: new Date().toISOString(),
      isTyping: true
    }])

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputMessage,
          filename: uploadedFile?.name || null
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      // Remove typing indicator and add real response
      setMessages(prev => prev.filter(msg => msg.id !== typingIndicatorId))
      const assistantMessage: ChatMessageType = {
        id: uuidv4(),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, assistantMessage])
      scrollToBottom()
    } catch (error) {
      // Remove typing indicator and add error message
      setMessages(prev => prev.filter(msg => msg.id !== typingIndicatorId))
      const errorMessage: ChatMessageType = {
        id: uuidv4(),
        role: 'assistant',
        content: 'An error occurred. Please try again.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (file: File) => {
    setUploadedFile(file)
    const uploadMessage: ChatMessageType = {
      id: uuidv4(),
      role: 'assistant',
      content: `I've received your PDF: ${file.name}. You can now ask questions about its contents.`,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, uploadMessage])
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-50">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">PDF Chatbot</h1>

        {/* File Upload Section */}
        <div className="mb-6">
          <FileUpload onFileUpload={handleFileUpload} />
          {uploadedFile && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
              Active PDF: {uploadedFile.name}
            </div>
          )}
        </div>

        {/* Chat Section */}
        <div className="border rounded-lg bg-gray-50">
          {/* Messages */}
          <div
            ref={chatContainerRef}
            className="h-[400px] overflow-y-auto p-4 scroll-smooth"
          >
            {messages.map(message => (
              message.isTyping ? (
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
                placeholder={uploadedFile
                  ? "Ask a question about the PDF..."
                  : "Ask me anything about my functionality..."}
                className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-y
                  text-gray-900 placeholder-gray-500 bg-white border-gray-300 text-base"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Press Enter to send, Shift + Enter for new line
                </p>
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                    disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
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
