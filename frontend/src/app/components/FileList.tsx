'use client'

import { useState, useEffect } from 'react'
import { FiFile, FiTrash2, FiClock } from 'react-icons/fi'

interface FileInfo {
  filename: string
  size: number
  created_at: number
  last_modified: number
}

interface FileListProps {
  onFileSelect: (filename: string) => void
  activeFile: string | null
}

export default function FileList({ onFileSelect, activeFile }: FileListProps) {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch files on mount
  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('http://localhost:8000/api/files')
      if (!response.ok) throw new Error('Failed to fetch files')
      const data = await response.json()
      setFiles(data.files)
    } catch (err) {
      setError('Failed to load files')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (filename: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent file selection when clicking delete
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return

    try {
      const response = await fetch(`http://localhost:8000/api/files/${filename}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete file')
      await fetchFiles() // Refresh the list
    } catch (err) {
      console.error(err)
      alert('Failed to delete file')
    }
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
          <FiFile className="w-5 h-5 mt-1 text-blue-500 dark:text-blue-400 flex-shrink-0" />
          <div className="ml-3 flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {file.filename}
              </p>
              <button
                onClick={(e) => handleDelete(file.filename, e)}
                className="p-1 rounded-lg opacity-0 group-hover:opacity-100
                  hover:bg-red-50 dark:hover:bg-red-900/20
                  text-red-500 dark:text-red-400"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
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
    </div>
  )
} 