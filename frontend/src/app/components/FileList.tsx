'use client'

import { useState } from 'react'
import { FiFile, FiTrash2, FiClock } from 'react-icons/fi'
import DeleteFileModal from './DeleteFileModal'

interface FileInfo {
  filename: string
  size: number
  created_at: number
  last_modified: number
}

interface FileListProps {
  onFileSelect: (filename: string) => void
  activeFile: string | null
  files: FileInfo[]
  isLoading: boolean
  error: string | null
  onDelete: (filename: string) => Promise<void>
  onDeleteComplete: () => void
}

export default function FileList({
  onFileSelect,
  activeFile,
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
    <div className="space-y-2 p-2">
      {files.map((file) => (
        <div
          key={file.filename}
          onClick={() => onFileSelect(file.filename)}
          className={`flex items-start p-3 rounded-lg cursor-pointer group
            ${activeFile === file.filename
              ? 'bg-blue-50 dark:bg-blue-900/20'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
        >
          <div className="w-16 h-20 flex-shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center">
            <FiFile className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>

          <div className="ml-3 flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {file.filename}
              </p>
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => handleDelete(file.filename, e)}
                  className="p-1 rounded-lg opacity-0 group-hover:opacity-100
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
  )
} 