import { useState, useEffect, useCallback } from 'react'

interface FileInfo {
  filename: string
  size: number
  created_at: number
  last_modified: number
}

interface CacheData {
  version: string
  files: FileInfo[]
  timestamp: number
}

const CACHE_VERSION = '1'
const CACHE_KEY = `pdf_pal_file_list_v${CACHE_VERSION}`
// Cache duration set to 30 minutes since file list rarely changes unexpectedly
// and we update the cache immediately on file operations (upload/delete)
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes
const MAX_CACHED_FILES = 1000 // Limit cache to prevent memory issues

export function useFileList() {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY)
      setRefreshTrigger(prev => prev + 1) // Trigger a refresh when cache is cleared
    } catch (err) {
      console.error('Error clearing cache:', err)
    }
  }, [])

  const updateCache = useCallback((files: FileInfo[]) => {
    try {
      // Don't cache if too many files
      if (files.length > MAX_CACHED_FILES) {
        clearCache()
        return
      }

      const cacheData: CacheData = {
        version: CACHE_VERSION,
        files,
        timestamp: Date.now()
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
    } catch (err) {
      console.error('Error updating cache:', err)
      clearCache()
    }
  }, [clearCache])

  // Fetch fresh data
  const fetchFiles = useCallback(async (skipCache = false) => {
    try {
      setError(null)
      if (!skipCache) setIsLoading(true)

      const response = await fetch('http://localhost:8000/api/files')
      if (!response.ok) {
        clearCache() // Clear cache on API error
        throw new Error('Failed to fetch files')
      }

      const data = await response.json()
      setFiles(data.files)
      updateCache(data.files)
    } catch (err) {
      setError('Failed to load files')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [clearCache, updateCache])

  // Delete file and update cache
  const deleteFile = useCallback(async (filename: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/files/${filename}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete file')

      // Update local state and cache
      const updatedFiles = files.filter(f => f.filename !== filename)
      setFiles(updatedFiles)
      updateCache(updatedFiles)
    } catch (err) {
      console.error(err)
      throw new Error('Failed to delete file')
    }
  }, [files, updateCache])

  // Fetch files when component mounts or when refreshTrigger changes
  useEffect(() => {
    fetchFiles(true)
  }, [fetchFiles, refreshTrigger])

  return {
    files,
    isLoading,
    error,
    fetchFiles,
    deleteFile,
    clearCache
  }
} 