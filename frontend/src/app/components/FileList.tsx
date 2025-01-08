'use client'

import React, { useEffect, useState } from 'react';
import { FiFile, FiTrash2 } from 'react-icons/fi';

interface FileInfo {
  filename: string;
  size: number;
  created_at: number;
  last_modified: number;
}

interface FileListProps {
  onFileSelect: (filename: string) => void;
  onFileDelete: (filename: string) => void;
  activeFile: string | null;
}

export default function FileList({ onFileSelect, onFileDelete, activeFile }: FileListProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/files');
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      const data = await response.json();
      setFiles(data.files);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDelete = async (filename: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent file selection when clicking delete

    if (!confirm(`Are you sure you want to delete ${filename}?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/files/${filename}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      await fetchFiles(); // Refresh the list
      onFileDelete(filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 dark:text-red-400 p-4 text-center">
        {error}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 p-4 text-center">
        No files uploaded yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.filename}
          onClick={() => onFileSelect(file.filename)}
          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer
            ${activeFile === file.filename
              ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}
            hover:border-blue-300 dark:hover:border-blue-700 transition-colors`}
        >
          <div className="flex items-center space-x-3">
            <FiFile className="text-gray-400 dark:text-gray-500" />
            <div>
              <div className="font-medium text-gray-700 dark:text-gray-200">{file.filename}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(file.size)} • Uploaded {formatDate(file.created_at)}
              </div>
            </div>
          </div>

          <button
            onClick={(e) => handleDelete(file.filename, e)}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 
              rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            title="Delete file"
          >
            <FiTrash2 />
          </button>
        </div>
      ))}
    </div>
  );
} 