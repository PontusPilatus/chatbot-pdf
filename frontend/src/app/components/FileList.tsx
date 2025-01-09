'use client'

import { useState } from 'react'
import { FiFile, FiTrash2, FiClock, FiEye } from 'react-icons/fi'
import DeleteFileModal from './DeleteFileModal'

interface FileInfo {
  filename: string
  size: number
  created_at: number
  last_modified: number
}

interface FileListProps {
  onFileSelect: (filename: string | null) => void
  activeFile: string | null
  chatFile: string | null
  onChatFileSelect: (filename: string) => void
  files: FileInfo[]
  isLoading: boolean
  error: string | null
  onDelete: (filename: string) => Promise<void>
  onDeleteComplete: () => void
}

export default function FileList({
  onFileSelect,
  activeFile,
  chatFile,
  onChatFileSelect,
  files,
  isLoading,
  error,
  onDelete,
  onDeleteComplete
}: FileListProps) {
  const [selectedFile, setSelectedFile] = useState<{ id: string, name: string } | null>(null)

  const handleDelete = async (filename: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent file selection when clicking delete
    setSelectedFile({ id: filename, name: filename })
  }

  const handlePreview = (filename: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent file selection when clicking preview
    if (activeFile === filename) {
      // If this file is already being previewed, close the preview
      onFileSelect(null)
    } else {
      // Otherwise, preview this file
      onFileSelect(filename)
    }
  }

  const handleConfirmDelete = async () => {
    if (selectedFile) {
      try {
        await onDelete(selectedFile.id)
        setSelectedFile(null)
        onDeleteComplete()
      } catch (err) {
        alert('Failed to delete file')
      }
    }
  }

  const handleCancelDelete = () => {
    setSelectedFile(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 text-gray-500 dark:text-gray-400">
        <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 
          border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin mr-2">
        </div>
        Loading files...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 dark:text-red-400">
        {error}
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="p-4 text-gray-500 dark:text-gray-400 text-center">
        No files uploaded yet
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-240px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
      <div className="p-2">
        {files.map((file) => (
          <div
            key={file.filename}
            onClick={() => onChatFileSelect(file.filename)}
            className={`flex items-start p-3 rounded-lg group cursor-pointer mb-2
              ${activeFile === file.filename
                ? 'bg-blue-50 dark:bg-blue-900/20'
                : chatFile === file.filename
                  ? 'bg-gray-100 dark:bg-gray-700'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {file.filename}
                </p>
                <div className="flex items-center space-x-1 min-w-[68px]">
                  <button
                    onClick={(e) => handlePreview(file.filename, e)}
                    className={`p-1 rounded-lg hidden group-hover:block
                      hover:bg-blue-50 dark:hover:bg-blue-900/20
                      text-blue-500 dark:text-blue-400
                      ${activeFile === file.filename ? '!block' : ''}`}
                    title={activeFile === file.filename ? 'Currently previewing' : 'Preview file'}
                  >
                    <FiEye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(file.filename, e)}
                    className="p-1 rounded-lg hidden group-hover:block
                      hover:bg-red-50 dark:hover:bg-red-900/20
                      text-red-500 dark:text-red-400"
                    title="Delete file"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400 space-x-2">
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <FiClock className="w-3 h-3" />
                <span>{formatDate(file.last_modified)}</span>
              </div>
            </div>
          </div>
        ))}

        <DeleteFileModal
          isOpen={selectedFile !== null}
          fileName={selectedFile?.name || ''}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      </div>
    </div>
  )
} 