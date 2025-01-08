'use client'

import { useState } from 'react'
import FileUpload from './FileUpload'
import FileList from './FileList'
import { useTheme } from '../contexts/ThemeContext'
import { FiUpload, FiList, FiSettings, FiInfo, FiSun, FiMoon, FiClock, FiTrash2, FiGlobe } from 'react-icons/fi'

interface SidebarProps {
  activePDF: string | null
  onFileProcessed: (filename: string) => void
  onSummaryReceived: (summary: string) => void
  className?: string
  onLanguageChange?: (language: string) => void
}

type Tab = 'files' | 'upload' | 'settings' | 'about'

export default function Sidebar({ activePDF, onFileProcessed, onSummaryReceived, className = '', onLanguageChange }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>('files')
  const { isDarkMode, toggleDarkMode } = useTheme()

  const handleFileSelect = (filename: string) => {
    onFileProcessed(filename)
  }

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'ru', name: 'Русский' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
  ]

  return (
    <div className={`w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col ${className}`}>
      {/* Sidebar Header */}
      <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center px-4">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">PDF Chatbot</h1>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-4 gap-1 p-2 bg-gray-50 dark:bg-gray-800/50">
        <button
          onClick={() => setActiveTab('files')}
          className={`flex flex-col items-center p-2 rounded-lg text-sm
            ${activeTab === 'files'
              ? 'bg-white dark:bg-gray-800 text-blue-500 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800/50'}`}
        >
          <FiList className="w-5 h-5 mb-1" />
          Files
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex flex-col items-center p-2 rounded-lg text-sm
            ${activeTab === 'upload'
              ? 'bg-white dark:bg-gray-800 text-blue-500 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800/50'}`}
        >
          <FiUpload className="w-5 h-5 mb-1" />
          Upload
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center p-2 rounded-lg text-sm
            ${activeTab === 'settings'
              ? 'bg-white dark:bg-gray-800 text-blue-500 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800/50'}`}
        >
          <FiSettings className="w-5 h-5 mb-1" />
          Settings
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`flex flex-col items-center p-2 rounded-lg text-sm
            ${activeTab === 'about'
              ? 'bg-white dark:bg-gray-800 text-blue-500 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800/50'}`}
        >
          <FiInfo className="w-5 h-5 mb-1" />
          About
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'files' && (
          <FileList
            onFileSelect={handleFileSelect}
            activeFile={activePDF}
          />
        )}
        {activeTab === 'upload' && (
          <div className="p-4">
            <FileUpload
              onFileProcessed={onFileProcessed}
              onSummaryReceived={onSummaryReceived}
            />
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="p-4 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Settings
              </h2>
            </div>

            {/* Appearance Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Appearance
              </h3>
              <div className="space-y-3">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {isDarkMode ? (
                      <FiMoon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    ) : (
                      <FiSun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    )}
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Dark Mode
                    </span>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full
                      transition-colors duration-200 ease-in-out focus:outline-none
                      ${isDarkMode ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow
                        transition-transform duration-200 ease-in-out
                        ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Chat Settings
              </h3>
              <div className="space-y-3">
                {/* Language Selection */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FiGlobe className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Response Language
                    </span>
                  </div>
                  <select
                    onChange={(e) => onLanguageChange?.(e.target.value)}
                    className="px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-200 
                      dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300
                      focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    defaultValue="en"
                  >
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message Display */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FiClock className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Show Timestamps
                    </span>
                  </div>
                  <button
                    className={`relative inline-flex h-6 w-11 items-center rounded-full
                      bg-gray-200 dark:bg-gray-700 transition-colors duration-200 ease-in-out`}
                  >
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white shadow translate-x-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* File Management */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                File Management
              </h3>
              <div className="space-y-3">
                {/* Auto-delete Files */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FiTrash2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Auto-delete Files
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Delete files after 30 days
                      </span>
                    </div>
                  </div>
                  <button
                    className={`relative inline-flex h-6 w-11 items-center rounded-full
                      bg-gray-200 dark:bg-gray-700 transition-colors duration-200 ease-in-out`}
                  >
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white shadow translate-x-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Coming Soon Section */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <FiInfo className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    More Settings Coming Soon
                  </h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    We're working on adding more customization options, including PDF preview settings, chat history management, and keyboard shortcuts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'about' && (
          <div className="p-4 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                About PDF Chatbot
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                An intelligent chatbot designed to help you interact with and understand PDF documents through natural conversation.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Key Features
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Smart PDF processing with automatic text extraction and chunking</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Context-aware responses using advanced AI technology</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Real-time streaming responses for faster interactions</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Efficient file management with upload tracking</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Technologies
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Next.js & TypeScript for the frontend</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Python & FastAPI for the backend</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>OpenAI's GPT for intelligent responses</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>ChromaDB for efficient document storage</span>
                </li>
              </ul>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Version 1.0.0</span>
                <a
                  href="https://github.com/yourusername/pdf-chatbot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-500 dark:hover:text-blue-400"
                >
                  View on GitHub
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 