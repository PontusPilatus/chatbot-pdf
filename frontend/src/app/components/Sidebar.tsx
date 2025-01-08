'use client'

import React, { useState } from 'react';
import { FiMenu, FiX, FiUpload, FiList, FiSettings, FiInfo, FiMoon, FiSun } from 'react-icons/fi';
import FileList from './FileList';
import FileUpload from './FileUpload';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarProps {
  activePDF: string | null;
  onFileProcessed: (filename: string) => void;
  onSummaryReceived: (summary: string) => void;
  className?: string;
}

export default function Sidebar({ activePDF, onFileProcessed, onSummaryReceived, className = '' }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'files' | 'upload' | 'settings' | 'about'>('files');
  const { isDarkMode, toggleDarkMode } = useTheme();

  const tabs = [
    { id: 'files', label: 'Files', icon: FiList },
    { id: 'upload', label: 'Upload', icon: FiUpload },
    { id: 'settings', label: 'Settings', icon: FiSettings },
    { id: 'about', label: 'About', icon: FiInfo },
  ] as const;

  return (
    <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
      flex flex-col transition-all duration-300 ${className}
      ${isCollapsed ? 'w-16' : 'w-80'}`}>
      {/* Sidebar Header */}
      <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
        {!isCollapsed && <h1 className="font-semibold text-gray-800 dark:text-gray-200">PDF Chatbot</h1>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          {isCollapsed ? <FiMenu className="text-gray-600 dark:text-gray-300" /> : <FiX className="text-gray-600 dark:text-gray-300" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div className="grid grid-cols-4 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center justify-center py-3 px-1 relative transition-colors
              ${activeTab === id
                ? 'text-blue-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <Icon className={`w-5 h-5 ${!isCollapsed && 'mb-1'}`} />
            {!isCollapsed && (
              <span className="text-xs font-medium truncate">
                {label}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'files' && (
          <FileList
            onFileSelect={(filename) => {
              onFileProcessed(filename);
            }}
            onFileDelete={(filename) => {
              // Handle file deletion
            }}
            activeFile={activePDF}
          />
        )}

        {activeTab === 'upload' && (
          <FileUpload
            onFileProcessed={onFileProcessed}
            onSummaryReceived={onSummaryReceived}
          />
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h2 className="font-medium text-gray-800 dark:text-gray-200">Settings</h2>
            <div className="space-y-4">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
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
                    transition-colors duration-200 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${isDarkMode ? 'bg-blue-500' : 'bg-gray-200'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg
                      transition-transform duration-200 ease-in-out
                      ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>

              {/* More settings can go here */}
              <div className="text-sm text-gray-500 dark:text-gray-400">
                More settings coming soon...
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="space-y-4">
            <h2 className="font-medium text-gray-800 dark:text-gray-200">About PDF Chatbot</h2>
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <p>
                PDF Chatbot is an AI-powered tool that helps you interact with your PDF documents
                through natural conversation.
              </p>
              <p>
                Features:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Upload and process PDF files</li>
                <li>Ask questions about document content</li>
                <li>Get smart, context-aware responses</li>
                <li>Manage multiple documents</li>
                <li>Real-time streaming responses</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Active PDF Indicator */}
      {activePDF && !isCollapsed && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Document:</div>
          <div className="text-sm text-gray-800 dark:text-gray-200 truncate">{activePDF}</div>
        </div>
      )}
    </div>
  );
} 