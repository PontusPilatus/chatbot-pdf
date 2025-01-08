'use client'

import { useState, useEffect, useRef } from 'react'
import FileUpload from './FileUpload'
import FileList from './FileList'
import { useTheme } from '../contexts/ThemeContext'
import { FiUser, FiUpload, FiList, FiSettings, FiInfo, FiSun, FiMoon, FiClock, FiTrash2, FiGlobe, FiChevronDown } from 'react-icons/fi'
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
  className?: string
  onSettingsChange?: (settings: {
    showTimestamps: boolean,
    autoDeleteFiles: boolean,
    selectedAvatar: string,
    selectedUserAvatar: string
  }) => void
}

type Tab = 'files' | 'upload' | 'settings' | 'about'

export default function Sidebar({ activePDF, onFileProcessed, onSummaryReceived, className = '', onSettingsChange }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>('files')
  const { isDarkMode, toggleDarkMode, fontSize, setFontSize } = useTheme()
  const [showTimestamps, setShowTimestamps] = useState(true)
  const [autoDeleteFiles, setAutoDeleteFiles] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState('TbRobot')
  const [selectedUserAvatar, setSelectedUserAvatar] = useState('FiUser')
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false)
  const [isUserAvatarDropdownOpen, setIsUserAvatarDropdownOpen] = useState(false)
  const avatarDropdownRef = useRef<HTMLDivElement>(null)
  const userAvatarDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (avatarDropdownRef.current && !avatarDropdownRef.current.contains(event.target as Node)) {
        setIsAvatarDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    <div className={`w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col ${className}`}>
      {/* Sidebar Header */}
      <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center px-4">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">PDF Pal</h1>
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
                      {isDarkMode ? 'Light Mode' : 'Dark Mode'}
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

            {/* Text Size */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Text Size
              </h3>
              <div className="space-y-3">
                <div className="flex flex-col space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Font Size: {fontSize}px
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                        className="p-2 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 
                          hover:bg-gray-100 dark:hover:bg-gray-600
                          border border-gray-200 dark:border-gray-600"
                      >
                        -
                      </button>
                      <button
                        onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                        className="p-2 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 
                          hover:bg-gray-100 dark:hover:bg-gray-600
                          border border-gray-200 dark:border-gray-600"
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
                <div className="flex flex-col space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
                          bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 
                          hover:bg-gray-100 dark:hover:bg-gray-600
                          border border-gray-200 dark:border-gray-600"
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
                          style={{ width: '256px' }} // 4 icons * (48px + gap) per row
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
                <div className="flex flex-col space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
                          bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 
                          hover:bg-gray-100 dark:hover:bg-gray-600
                          border border-gray-200 dark:border-gray-600"
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
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FiClock className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Show Timestamps
                    </span>
                  </div>
                  <button
                    onClick={() => updateShowTimestamps(!showTimestamps)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full
                      transition-colors duration-200 ease-in-out focus:outline-none
                      ${showTimestamps ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
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
                    onClick={() => updateAutoDeleteFiles(!autoDeleteFiles)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full
                      transition-colors duration-200 ease-in-out focus:outline-none
                      ${autoDeleteFiles ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
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
        )}
        {activeTab === 'about' && (
          <div className="p-4 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                About PDF Pal
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                An intelligent companion designed to help you interact with and understand PDF documents through natural conversation.
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
          </div>
        )}
      </div>
    </div>
  )
} 