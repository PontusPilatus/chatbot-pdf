import { useState, useEffect } from 'react'

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

  const clearCache = () => {
    try {
      localStorage.removeItem(CACHE_KEY)
    } catch (err) {
      console.error('Error clearing cache:', err)
    }
  }

  const updateCache = (files: FileInfo[]) => {
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
  }

  // Load cached data on mount
  useEffect(() => {
    const cachedData = localStorage.getItem(CACHE_KEY)
    if (cachedData) {
      try {
        const data: CacheData = JSON.parse(cachedData)
        const age = Date.now() - data.timestamp

        // Validate cache version and age
        if (data.version === CACHE_VERSION && age < CACHE_DURATION) {
          setFiles(data.files)
          setIsLoading(false)
        } else {
          clearCache() // Clear outdated cache
        }
      } catch (err) {
        console.error('Error parsing cached file list:', err)
        clearCache()
      }
    }
  }, [])

  // Fetch fresh data
  const fetchFiles = async (skipCache = false) => {
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
  }

  // Delete file and update cache
  const deleteFile = async (filename: string) => {
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
  }

  return {
    files,
    isLoading,
    error,
    fetchFiles,
    deleteFile,
    clearCache // Expose clearCache for manual cache clearing if needed
  }
} 