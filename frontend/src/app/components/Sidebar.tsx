'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import FileUpload from './FileUpload'
import FileList from './FileList'
import { useTheme } from '../contexts/ThemeContext'
import { useFileList } from '../hooks/useFileList'
import { FiUser, FiUpload, FiList, FiSettings, FiInfo, FiSun, FiMoon, FiClock, FiTrash2, FiGlobe, FiChevronDown, FiX } from 'react-icons/fi'
import { RiRobotFill, RiOpenaiFill, RiRobot2Fill, RiRobotLine, RiAliensFill, RiSpaceShipFill, RiUserSmileLine, RiUserHeartLine, RiUserStarLine, RiUserSettingsLine, RiUserSearchLine, RiUserLocationLine, RiUserFollowLine, RiUserSharedLine, RiUserVoiceLine, RiEarthLine } from 'react-icons/ri'
import { HiSparkles } from 'react-icons/hi'
import { BiBrain, BiUserCircle, BiUserPin, BiUserCheck } from 'react-icons/bi'
import { TbBrain, TbRobot } from 'react-icons/tb'
import { IoRocketSharp } from 'react-icons/io5'
import { GiBrain, GiRobotGolem, GiArtificialIntelligence, GiCyberEye, GiRobotAntennas } from 'react-icons/gi'

interface SidebarProps {
  activePDF: string | null
  onFileProcessed: (filename: string) => void
  onSummaryReceived: (summary: string) => void
  onFileSelect: (filename: string) => void
  className?: string
  onSettingsChange?: (settings: {
    showTimestamps: boolean,
    autoDeleteFiles: boolean,
    selectedAvatar: string,
    selectedUserAvatar: string
  }) => void
}

export default function Sidebar({ activePDF, onFileProcessed, onSummaryReceived, onFileSelect, className = '', onSettingsChange }: SidebarProps) {
  const [activeTab, setActiveTab] = useState('files')
  const [showTimestamps, setShowTimestamps] = useState(false)
  const [autoDeleteFiles, setAutoDeleteFiles] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState('RiRobotFill')
  const [selectedUserAvatar, setSelectedUserAvatar] = useState('FiUser')
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false)
  const [isUserAvatarDropdownOpen, setIsUserAvatarDropdownOpen] = useState(false)
  const avatarDropdownRef = useRef<HTMLDivElement>(null)
  const userAvatarDropdownRef = useRef<HTMLDivElement>(null)
  const { isDarkMode, toggleDarkMode, fontSize, setFontSize } = useTheme()
  const { files, isLoading, error, fetchFiles, deleteFile, clearCache } = useFileList()

  // Handle file list refresh
  const refreshFiles = useCallback(async () => {
    clearCache()
    await fetchFiles(true)
  }, [clearCache, fetchFiles])

  const handleFileSelect = (filename: string) => {
    onFileProcessed(filename)
  }

  // Update parent component when settings change
  const updateShowTimestamps = (value: boolean) => {
    setShowTimestamps(value)
    onSettingsChange?.({ showTimestamps: value, autoDeleteFiles, selectedAvatar, selectedUserAvatar })
  }

  const updateAutoDeleteFiles = (value: boolean) => {
    setAutoDeleteFiles(value)
    onSettingsChange?.({ showTimestamps, autoDeleteFiles: value, selectedAvatar, selectedUserAvatar })
  }

  const updateSelectedAvatar = (value: string) => {
    setSelectedAvatar(value)
    onSettingsChange?.({ showTimestamps, autoDeleteFiles, selectedAvatar: value, selectedUserAvatar })
  }

  const updateSelectedUserAvatar = (value: string) => {
    setSelectedUserAvatar(value)
    onSettingsChange?.({ showTimestamps, autoDeleteFiles, selectedAvatar, selectedUserAvatar: value })
  }

  const botAvatarOptions = [
    // Row 1: Robots
    { id: 'TbRobot', name: 'Robot 3', icon: TbRobot },
    { id: 'RiRobotFill', name: 'Robot', icon: RiRobotFill },
    { id: 'RiRobot2Fill', name: 'Robot 2', icon: RiRobot2Fill },
    { id: 'RiRobotLine', name: 'Robot 4', icon: RiRobotLine },
    // Row 2: Special Robots
    { id: 'GiRobotAntennas', name: 'Bot Friend', icon: GiRobotAntennas },
    { id: 'GiRobotGolem', name: 'Robot Golem', icon: GiRobotGolem },
    { id: 'RiAliensFill', name: 'Alien Bot', icon: RiAliensFill },
    { id: 'RiSpaceShipFill', name: 'Space Bot', icon: RiSpaceShipFill },
    // Row 3: Brains & AI
    { id: 'BiBrain', name: 'Brain', icon: BiBrain },
    { id: 'TbBrain', name: 'Brain 2', icon: TbBrain },
    { id: 'GiBrain', name: 'Brain 3', icon: GiBrain },
    { id: 'GiArtificialIntelligence', name: 'AI Brain', icon: GiArtificialIntelligence },
    // Row 4: Special Effects
    { id: 'HiSparkles', name: 'Sparkles', icon: HiSparkles },
    { id: 'GiCyberEye', name: 'Cyber Eye', icon: GiCyberEye },
    { id: 'IoRocketSharp', name: 'Rocket', icon: IoRocketSharp },
    { id: 'RiOpenaiFill', name: 'Minimal', icon: RiOpenaiFill },
  ]

  const userAvatarOptions = [
    // Row 1: Basic Users
    { id: 'FiUser', name: 'Default User', icon: FiUser },
    { id: 'BiUserCircle', name: 'Circle User', icon: BiUserCircle },
    { id: 'RiUserSmileLine', name: 'Happy User', icon: RiUserSmileLine },
    { id: 'RiUserHeartLine', name: 'Friendly User', icon: RiUserHeartLine },
    // Row 2: Special Users
    { id: 'RiUserStarLine', name: 'Star User', icon: RiUserStarLine },
    { id: 'RiUserVoiceLine', name: 'Voice User', icon: RiUserVoiceLine },
    { id: 'RiUserSettingsLine', name: 'Tech User', icon: RiUserSettingsLine },
    { id: 'RiUserSearchLine', name: 'Explorer User', icon: RiUserSearchLine },
    // Row 3: Action Users
    { id: 'RiUserLocationLine', name: 'Location User', icon: RiUserLocationLine },
    { id: 'RiUserFollowLine', name: 'Follow User', icon: RiUserFollowLine },
    { id: 'RiUserSharedLine', name: 'Shared User', icon: RiUserSharedLine },
    { id: 'BiUserPin', name: 'Pin User', icon: BiUserPin },
    // Row 4: Special Effects
    { id: 'BiUserCheck', name: 'Verified User', icon: BiUserCheck },
    { id: 'RiEarthLine', name: 'Global User', icon: RiEarthLine },
    { id: 'FiGlobe', name: 'World User', icon: FiGlobe },
    { id: 'HiSparkles', name: 'Sparkle User', icon: HiSparkles },
  ]

  return (
    <div className={`flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-[320px] ${className}`}>
      {/* Sidebar Header */}
      <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center px-4">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">PDF Pal</h1>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Files Section */}
        {activeTab === 'files' && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <FileUpload
                onFileProcessed={onFileProcessed}
                onSummaryReceived={onSummaryReceived}
                onUploadComplete={refreshFiles}
              />
            </div>
            <FileList
              onFileSelect={onFileSelect}
              activeFile={activePDF}
              files={files}
              isLoading={isLoading}
              error={error}
              onDelete={deleteFile}
              onDeleteComplete={refreshFiles}
            />
          </div>
        )}

        {/* Settings Section */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Header with Close Button */}
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Settings</h2>
                <button
                  onClick={() => setActiveTab('files')}
                  className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Appearance Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Appearance
                </h3>
                <div className="space-y-3">
                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {isDarkMode ? (
                        <FiMoon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      ) : (
                        <FiSun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      )}
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                      </span>
                    </div>
                    <button
                      onClick={toggleDarkMode}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full
                        transition-colors duration-200 ease-in-out focus:outline-none
                        ${isDarkMode ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'}`}
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

              {/* Text Size */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Text Size
                </h3>
                <div className="space-y-3">
                  <div className="flex flex-col space-y-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Font Size: {fontSize}px
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                          className="w-8 h-8 rounded-lg flex items-center justify-center
                            bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 
                            hover:bg-gray-100 dark:hover:bg-gray-500
                            border border-gray-200 dark:border-gray-500"
                        >
                          -
                        </button>
                        <button
                          onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                          className="w-8 h-8 rounded-lg flex items-center justify-center
                            bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300
                            hover:bg-gray-100 dark:hover:bg-gray-500
                            border border-gray-200 dark:border-gray-500"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="24"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Small</span>
                      <span>Large</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Chat Settings
                </h3>
                <div className="space-y-3">
                  {/* Avatar Selection */}
                  <div className="flex flex-col space-y-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {(() => {
                          const Icon = botAvatarOptions.find(opt => opt.id === selectedAvatar)?.icon || TbRobot
                          return <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        })()}
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Bot Avatar
                        </span>
                      </div>
                      <div className="relative group" ref={avatarDropdownRef}>
                        <button
                          className="p-2 rounded-lg flex items-center justify-center
                            bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 
                            hover:bg-gray-100 dark:hover:bg-gray-500
                            border border-gray-200 dark:border-gray-500"
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsAvatarDropdownOpen(!isAvatarDropdownOpen)
                          }}
                        >
                          <FiChevronDown className="w-4 h-4" />
                        </button>
                        {isAvatarDropdownOpen && (
                          <div
                            className="absolute right-0 mt-2 p-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg
                              border border-gray-200 dark:border-gray-600 z-50"
                            style={{ width: '256px' }}
                          >
                            <div className="grid grid-cols-4 gap-2">
                              {botAvatarOptions.map((option) => {
                                const Icon = option.icon
                                return (
                                  <button
                                    key={option.id}
                                    onClick={() => {
                                      updateSelectedAvatar(option.id)
                                      setIsAvatarDropdownOpen(false)
                                    }}
                                    className={`p-2 rounded-lg flex items-center justify-center transition-colors duration-200
                                      ${selectedAvatar === option.id
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'}`}
                                    title={option.name}
                                  >
                                    <Icon className="w-5 h-5" />
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* User Avatar Selection */}
                  <div className="flex flex-col space-y-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {(() => {
                          const Icon = userAvatarOptions.find(opt => opt.id === selectedUserAvatar)?.icon || FiUser
                          return <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        })()}
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          User Avatar
                        </span>
                      </div>
                      <div className="relative group" ref={userAvatarDropdownRef}>
                        <button
                          className="p-2 rounded-lg flex items-center justify-center
                            bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 
                            hover:bg-gray-100 dark:hover:bg-gray-500
                            border border-gray-200 dark:border-gray-500"
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsUserAvatarDropdownOpen(!isUserAvatarDropdownOpen)
                          }}
                        >
                          <FiChevronDown className="w-4 h-4" />
                        </button>
                        {isUserAvatarDropdownOpen && (
                          <div
                            className="absolute right-0 mt-2 p-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg
                              border border-gray-200 dark:border-gray-600 z-50"
                            style={{ width: '256px' }}
                          >
                            <div className="grid grid-cols-4 gap-2">
                              {userAvatarOptions.map((option) => {
                                const Icon = option.icon
                                return (
                                  <button
                                    key={option.id}
                                    onClick={() => {
                                      updateSelectedUserAvatar(option.id)
                                      setIsUserAvatarDropdownOpen(false)
                                    }}
                                    className={`p-2 rounded-lg flex items-center justify-center transition-colors duration-200
                                      ${selectedUserAvatar === option.id
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'}`}
                                    title={option.name}
                                  >
                                    <Icon className="w-5 h-5" />
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Message Display */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FiClock className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Timestamps
                      </span>
                    </div>
                    <button
                      onClick={() => updateShowTimestamps(!showTimestamps)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full
                        transition-colors duration-200 ease-in-out focus:outline-none
                        ${showTimestamps ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow
                          transition-transform duration-200 ease-in-out
                          ${showTimestamps ? 'translate-x-6' : 'translate-x-1'}`}
                      />
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
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FiTrash2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {autoDeleteFiles ? 'Auto-delete Enabled' : 'Auto-delete Disabled'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {autoDeleteFiles ? 'Files will be deleted after 30 days' : 'Files will be kept indefinitely'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => updateAutoDeleteFiles(!autoDeleteFiles)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full
                        transition-colors duration-200 ease-in-out focus:outline-none
                        ${autoDeleteFiles ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow
                          transition-transform duration-200 ease-in-out
                          ${autoDeleteFiles ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* About Section */}
        {activeTab === 'about' && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Header with Close Button */}
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">About PDF Pal</h2>
                <button
                  onClick={() => setActiveTab('files')}
                  className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="prose dark:prose-invert">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  An intelligent companion designed to help you interact with and understand PDF documents through natural conversation.
                </p>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Key Features</h3>
                  <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
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

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Technologies</h3>
                  <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
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

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Version</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">1.0.0</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-2 space-y-2">
          <button
            onClick={() => setActiveTab(activeTab === 'settings' ? 'files' : 'settings')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium
              transition-colors duration-150 ease-in-out
              ${activeTab === 'settings'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <FiSettings className="w-4 h-4 mr-2" />
            Settings
          </button>
          <button
            onClick={() => setActiveTab(activeTab === 'about' ? 'files' : 'about')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium
              transition-colors duration-150 ease-in-out
              ${activeTab === 'about'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <FiInfo className="w-4 h-4 mr-2" />
            About
          </button>
        </div>
      </div>
    </div>
  )
} 