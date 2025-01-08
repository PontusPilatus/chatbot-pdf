'use client'

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud } from 'react-icons/fi';

interface FileUploadProps {
  onFileProcessed: (filename: string) => void;
  onSummaryReceived: (summary: string) => void;
}

export default function FileUpload({ onFileProcessed, onSummaryReceived }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    // Create form data
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data = await response.json();

      // Handle successful upload
      onFileProcessed(file.name);

      // If we have a summary, send it to the chat
      if (data.summary) {
        onSummaryReceived(data.summary);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [onFileProcessed, onSummaryReceived]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          ${isDragActive
            ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30'
            : 'border-gray-300 dark:border-gray-600'}
          ${error
            ? 'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/30'
            : ''}
          hover:border-blue-500 dark:hover:border-blue-400 
          hover:bg-blue-50 dark:hover:bg-blue-900/30 
          transition-colors`}
      >
        <input {...getInputProps()} />
        <FiUploadCloud className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {uploading ? 'Uploading...' :
            isDragActive ? 'Drop the PDF here...' :
              'Drag & drop a PDF file here, or click to select'}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Only PDF files are supported (max 10MB)
        </p>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
} 