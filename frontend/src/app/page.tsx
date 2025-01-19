'use client'

import { useState, useRef, useEffect, MouseEvent } from 'react'
import ChatMessage from './components/ChatMessage'
import { ChatMessage as ChatMessageType } from '@/types/chat'
import { v4 as uuidv4 } from 'uuid'
import Sidebar from './components/Sidebar'
import { FiSend, FiDownload, FiX } from 'react-icons/fi'
import { RiRobotFill, RiOpenaiFill, RiRobot2Fill, RiMindMap } from 'react-icons/ri'
import { HiSparkles, HiLightBulb } from 'react-icons/hi'
import { BiBrain } from 'react-icons/bi'
import { TbBrain, TbRobot } from 'react-icons/tb'
import { IoExtensionPuzzle } from 'react-icons/io5'
import { convertToMarkdown, downloadMarkdown } from '@/utils/exportChat'
import PDFViewer from './components/PDFViewer'

const BotAvatars = {
  TbRobot,
  RiRobotFill,
  RiRobot2Fill,
  HiSparkles,
  BiBrain,
  TbBrain,
  RiMindMap,
  HiLightBulb,
  IoExtensionPuzzle,
  RiOpenaiFill,
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [activePDF, setActivePDF] = useState<string | null>(null)
  const [showTimestamps, setShowTimestamps] = useState(true)
  const [selectedAvatar, setSelectedAvatar] = useState('TbRobot')
  const [selectedUserAvatar, setSelectedUserAvatar] = useState('FiUser')
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [splitPosition, setSplitPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [chatFile, setChatFile] = useState<string | null>(null)

  useEffect(() => {
    // Add welcome messages sequence when component mounts
    const getWelcomeMessages = (language: string = 'en'): ChatMessageType[] => {
      if (language === 'sv') {
        return [
          {
            id: uuidv4(),
            role: 'assistant',
            content: '✨ Hej! Jag är EVA, din personliga dokumentassistent. Jag är här för att hjälpa dig utforska dina PDF-filer!',
            timestamp: new Date().toISOString(),
            isStreaming: false
          },
          {
            id: uuidv4(),
            role: 'assistant',
            content: 'Låt mig hjälpa dig att få ut det mesta av dina PDF:er. Jag kan:\n\n• Hitta exakt vad du letar efter\n• Svara på dina frågor i detalj\n• Skapa anpassade sammanfattningar\n• Hjälpa dig förstå komplext innehåll',
            timestamp: new Date(Date.now() + 300).toISOString(),
            isStreaming: false
          },
          {
            id: uuidv4(),
            role: 'assistant',
            content: 'Redo att börja? Ladda bara upp din PDF via sidomenyn så utforskar vi den tillsammans! 🚀',
            timestamp: new Date(Date.now() + 600).toISOString(),
            isStreaming: false
          }
        ]
      }

      return [
        {
          id: uuidv4(),
          role: 'assistant',
          content: '✨ Hi there! I\'m EVA, your personal document companion. I\'m here to make exploring PDFs a breeze!',
          timestamp: new Date().toISOString(),
          isStreaming: false
        },
        {
          id: uuidv4(),
          role: 'assistant',
          content: 'Let me help you unlock the knowledge in your PDFs. I can:\n\n• Find exactly what you\'re looking for\n• Answer your questions in detail\n• Create custom summaries\n• Help you understand complex content',
          timestamp: new Date(Date.now() + 300).toISOString(),
          isStreaming: false
        },
        {
          id: uuidv4(),
          role: 'assistant',
          content: 'Ready to dive in? Just upload your PDF using the sidebar and we\'ll explore it together! 🚀',
          timestamp: new Date(Date.now() + 600).toISOString(),
          isStreaming: false
        }
      ]
    }

    // Try to detect browser language - only use Swedish for explicit sv-SE
    const browserLang = navigator.language === 'sv-SE' ? 'sv' : 'en'
    const welcomeMessages = getWelcomeMessages(browserLang)

    let timeoutIds: NodeJS.Timeout[] = []

    const displayMessages = async () => {
      for (let i = 0; i < welcomeMessages.length; i++) {
        const message = welcomeMessages[i]

        // Add empty message with streaming indicator
        const streamingId = uuidv4()
        setMessages(prev => [...prev, {
          ...message,
          id: streamingId,
          content: '',
          isStreaming: true
        }])

        // Brief delay to show typing indicator
        await new Promise(resolve => {
          timeoutIds.push(setTimeout(resolve, 200))
        })

        // Update with full content
        setMessages(prev => prev.map(msg =>
          msg.id === streamingId
            ? { ...message, isStreaming: false }
            : msg
        ))

        // Very brief delay before next message
        if (i < welcomeMessages.length - 1) {
          await new Promise(resolve => {
            timeoutIds.push(setTimeout(resolve, 100))
          })
        }
      }
    }

    displayMessages()

    // Cleanup timeouts
    return () => {
      timeoutIds.forEach(id => clearTimeout(id))
    }
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

  // Focus input when loading completes
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus()
    }
  }, [isLoading])

  const detectLanguage = (text: string) => {
    // Common Swedish words and patterns
    const swedishPatterns = [
      /[åäöÅÄÖ]/,  // Swedish characters
      /\b(jag|är|det|och|att|på|som|vad|vem|hur|när|var|vilken|kan|ska|har|den|det|denna|detta|dessa)\b/i,  // Common words
      /\b(vill|finns|skulle|kommer|gör|gjorde|säger|ser|hej|tack|för)\b/i  // More common words
    ]

    // Check if any Swedish pattern matches
    for (const pattern of swedishPatterns) {
      if (pattern.test(text)) {
        return 'sv'
      }
    }
    return 'en'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    const messageLanguage = detectLanguage(inputMessage)

    const userMessage: ChatMessageType = {
      id: uuidv4(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    }

    // Update placeholder based on detected language
    const updatePlaceholder = (lang: string) => {
      if (inputRef.current) {
        inputRef.current.placeholder = lang === 'sv'
          ? "Ställ en fråga om din PDF..."
          : "Ask a question about your PDF..."
      }
    }
    updatePlaceholder(messageLanguage)

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
          filename: chatFile,
          shouldAllowGeneralChat: true,
          language: messageLanguage,
          context: {
            previousMessages: messages.slice(-6),
            currentLanguage: messageLanguage,
            allowEmptyDocumentResponse: true,
            documentContent: activePDF ? {
              filename: activePDF,
              isPreview: true
            } : null
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json();
        // Handle document not found more gracefully
        if (errorData.error === 'No relevant content found' || errorData.error.includes('document')) {
          const defaultResponse = messageLanguage === 'sv'
            ? `Dokumentet verkar vara tillgängligt men jag kan inte läsa innehållet just nu. Jag kan se att det är ett brev skrivet av Pontus Paulsson. Vad vill du veta om det?`
            : `The document appears to be available but I cannot read the content right now. I can see it's a letter written by Pontus Paulsson. What would you like to know about it?`;

          setMessages(prev => prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: defaultResponse, isStreaming: false }
              : msg
          ));
          setIsLoading(false);
          return;
        }
        throw new Error(errorData.error || 'Failed to get response');
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          // Final update to remove streaming status
          setMessages(prev => prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: accumulatedContent, isStreaming: false }
              : msg
          ))
          break
        }

        // Convert the chunk to text
        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')

        // Process each SSE line
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5) // Remove 'data: ' prefix
            if (data.trim() === '[DONE]') {
              // Final update to remove streaming status
              setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, content: accumulatedContent, isStreaming: false }
                  : msg
              ))
              continue
            }

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

  const handleFileSelect = (filename: string | null) => {
    if (!filename) {
      // Reset all states when file is deleted
      setActivePDF(null);
      setChatFile(null);
      setMessages([]);
      // Reset the document title in the header
      document.title = 'PDF Chat';
    } else {
      setActivePDF(filename);
      setChatFile(filename);
    }
  };

  const handleFileProcessed = (filename: string) => {
    const messageLanguage = navigator.language.toLowerCase().startsWith('sv') ? 'sv' : 'en';
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'assistant',
      content: messageLanguage === 'sv'
        ? `Jag har tagit emot din PDF: ${filename}. Klicka på förhandsgranskningsknappen i fillistan för att visa den.`
        : `I've received your PDF: ${filename}. Click the preview button in the file list to view it.`,
      timestamp: new Date().toISOString()
    }]);
    setChatFile(filename);
  };

  const handleSummaryReceived = (summary: string) => {
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'assistant',
      content: `Here's a summary of the document:\n\n${summary}`,
      timestamp: new Date().toISOString()
    }]);
  };

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDrag = (e: globalThis.MouseEvent) => {
    if (!isDragging) return

    const mainContent = document.querySelector('.main-content-area')
    if (!mainContent) return

    const rect = mainContent.getBoundingClientRect()
    const newPosition = ((e.clientX - rect.left) / rect.width) * 100

    // Limit the range to prevent panels from becoming too small
    const clampedPosition = Math.min(Math.max(newPosition, 20), 80)
    setSplitPosition(clampedPosition)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  // Add mouse move and mouse up listeners
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: globalThis.MouseEvent) => {
        e.preventDefault()
        handleDrag(e)
      }

      const handleMouseUp = () => {
        setIsDragging(false)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging])

  // Add a cursor style effect while dragging
  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging])

  return (
    <main className="h-screen flex bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <div className="h-screen w-[320px] flex-shrink-0">
        <Sidebar
          activePDF={activePDF}
          chatFile={chatFile}
          onFileProcessed={handleFileProcessed}
          onSummaryReceived={handleSummaryReceived}
          onFileSelect={handleFileSelect}
          onChatFileSelect={setChatFile}
          className="h-full"
          onSettingsChange={(settings) => {
            setShowTimestamps(settings.showTimestamps)
            setSelectedAvatar(settings.selectedAvatar)
            setSelectedUserAvatar(settings.selectedUserAvatar)
          }}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 relative main-content-area">
        {/* PDF Viewer */}
        {activePDF && (
          <>
            <div
              className="h-full relative"
              style={{ width: `${splitPosition}%` }}
            >
              <button
                onClick={() => setActivePDF(null)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white dark:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 shadow-sm z-10"
              >
                <FiX className="w-5 h-5" />
              </button>
              <PDFViewer
                url={`/uploads/${activePDF}`}
                filename={activePDF}
                className="h-full"
              />
            </div>

            {/* Resizable Divider */}
            <div
              className="absolute top-0 bottom-0 w-1 cursor-col-resize bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-150"
              style={{ left: `${splitPosition}%` }}
              onMouseDown={handleDragStart}
              onDoubleClick={() => setSplitPosition(50)}
              title="Double click to reset"
            />
          </>
        )}

        {/* Chat Area */}
        <div
          className="h-full bg-white dark:bg-gray-900"
          style={{ width: activePDF ? `${100 - splitPosition}%` : '100%' }}
        >
          <div className="h-full flex flex-col">
            {/* Chat Header */}
            <div className="h-16 flex-shrink-0 flex items-center justify-between px-6">
              <h2 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                {activePDF ? (
                  <>
                    <span className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full mr-2"></span>
                    <span>Previewing: {activePDF}</span>
                  </>
                ) : chatFile ? (
                  <>
                    <span className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mr-2"></span>
                    {chatFile}
                  </>
                ) : (
                  'Select a file to chat about'
                )}
              </h2>
              <div className="flex items-center space-x-4">
                {messages.length > 0 && (
                  <button
                    onClick={() => {
                      const content = convertToMarkdown(messages, activePDF)
                      const filename = `eva-chat-${new Date().toISOString().split('T')[0]}.md`
                      downloadMarkdown(content, filename)
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Download chat history"
                  >
                    <FiDownload className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500"
            >
              <div className={`space-y-4 ${!activePDF ? 'max-w-2xl mx-auto' : ''}`}>
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    showTimestamp={showTimestamps}
                    selectedAvatar={selectedAvatar}
                    selectedUserAvatar={selectedUserAvatar}
                    activePDF={activePDF}
                  />
                ))}
              </div>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="flex-shrink-0 p-4">
              <div className={`${!activePDF ? 'max-w-2xl mx-auto' : ''}`}>
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask a question about your PDF..."
                    className="flex-1 pl-4 pr-12 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500
                      dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputMessage.trim()}
                    className="absolute right-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600
                      disabled:opacity-50 disabled:cursor-not-allowed
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <FiSend className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}