'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface FileUploadProps {
  onFileUpload: (file: File) => void
}

export default function FileUpload({ onFileUpload }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type === 'application/pdf') {
      setUploading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('http://localhost:8000/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        onFileUpload(file)
      } catch (error) {
        console.error('Error uploading file:', error)
        alert('Failed to upload file. Please try again.')
      } finally {
        setUploading(false)
      }
    } else {
      alert('Please upload a PDF file')
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
    <div
      {...getRootProps()}
      className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
    >
      <input {...getInputProps()} />
      <div className="mb-4">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
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
      {uploading ? (
        <p className="text-gray-600">Uploading...</p>
      ) : isDragActive ? (
        <p className="text-blue-500">Drop your PDF here</p>
      ) : (
        <>
          <p className="text-gray-600 mb-2">Drag and drop your PDF here, or click to select</p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
            Choose File
          </button>
        </>
      )}
    </div>
  )
} 