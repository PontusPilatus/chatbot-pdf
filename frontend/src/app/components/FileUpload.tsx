'use client'

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud } from 'react-icons/fi';

interface FileUploadProps {
  onFileProcessed: (filename: string) => void;
  onSummaryReceived: (summary: string) => void;
  onUploadComplete: () => void;
}

export default function FileUpload({ onFileProcessed, onSummaryReceived, onUploadComplete }: FileUploadProps) {
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

      // Notify parent that upload is complete
      onUploadComplete();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [onFileProcessed, onSummaryReceived, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
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
        <div className="flex items-center justify-center space-x-3">
          <FiUploadCloud className="h-6 w-6 text-gray-400 dark:text-gray-500" />
          <div className="text-left">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {uploading ? 'Uploading...' :
                isDragActive ? 'Drop the PDF here...' :
                  'Drop PDF here or click to upload'}
            </p>
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 