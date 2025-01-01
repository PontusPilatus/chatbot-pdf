'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface FileUploadProps {
  onFileUpload: (file: File) => void
}

export default function FileUpload({ onFileUpload }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkServerConnection = async () => {
    try {
      const response = await fetch('http://localhost:8000/')
      if (!response.ok) {
        throw new Error('Server is not responding properly')
      }
      return true
    } catch (error) {
      console.error('Server connection error:', error)
      return false
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null)
    const file = acceptedFiles[0]

    // Check file type
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      alert('Please upload a PDF file')
      return
    }

    // Check file size (10MB = 10 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size too large. Maximum size is 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB`)
      alert(`File size too large. Maximum size is 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB`)
      return
    }

    setUploading(true)
    try {
      // Check server connection first
      const isServerConnected = await checkServerConnection()
      if (!isServerConnected) {
        throw new Error('Cannot connect to server. Please make sure the backend server is running.')
      }

      console.log('Starting file upload:', file.name)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      })

      console.log('Upload response status:', response.status)
      const responseData = await response.json()
      console.log('Upload response:', responseData)

      if (!response.ok) {
        throw new Error(responseData.detail || 'Upload failed')
      }

      onFileUpload(file)
    } catch (error) {
      console.error('Error uploading file:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file'
      setError(errorMessage)
      alert(errorMessage)
    } finally {
      setUploading(false)
    }
  }, [onFileUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  })

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed ${error ? 'border-red-300' : 'border-gray-300'} 
          rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors
          flex items-center justify-center gap-4`}
      >
        <input {...getInputProps()} />
        <div className="flex-shrink-0">
          <svg
            className="h-8 w-8 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="text-left flex-grow">
          {uploading ? (
            <div>
              <p className="text-sm text-gray-600">Uploading...</p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-blue-600 h-1.5 rounded-full animate-pulse"></div>
              </div>
            </div>
          ) : isDragActive ? (
            <p className="text-sm text-blue-500">Drop your PDF here</p>
          ) : (
            <div>
              <p className="text-sm text-gray-600">Drag and drop a PDF here, or</p>
              <button className="mt-1 text-sm text-blue-500 hover:text-blue-600 font-medium">
                choose a file
              </button>
            </div>
          )}
        </div>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
} 