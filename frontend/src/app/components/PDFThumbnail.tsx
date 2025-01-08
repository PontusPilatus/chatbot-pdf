'use client'

import { useEffect, useRef, useState } from 'react'
import { FiFile } from 'react-icons/fi'
import { usePDFJS } from '../contexts/PDFJSContext'

interface PDFThumbnailProps {
  url: string
  width?: number
  onLoadSuccess?: () => void
  onLoadError?: (error: Error) => void
}

export default function PDFThumbnail({ url, width = 100, onLoadSuccess, onLoadError }: PDFThumbnailProps) {
  const [error, setError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const loadingTaskRef = useRef<any>(null)
  const renderTaskRef = useRef<any>(null)
  const { isLoaded } = usePDFJS()

  useEffect(() => {
    const loadPDF = async () => {
      if (!canvasRef.current || !isLoaded || !window.pdfjsLib) return
      setIsLoading(true)

      try {
        // Cancel any existing loading task
        if (loadingTaskRef.current) {
          await loadingTaskRef.current.destroy()
          loadingTaskRef.current = null
        }

        // Cancel any existing render task
        if (renderTaskRef.current) {
          await renderTaskRef.current.cancel()
          renderTaskRef.current = null
        }

        // Create new loading task
        loadingTaskRef.current = window.pdfjsLib.getDocument(`http://localhost:8000${url}`)
        const pdf = await loadingTaskRef.current.promise
        const page = await pdf.getPage(1)

        const viewport = page.getViewport({ scale: 0.5 })
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        if (!context) return

        canvas.height = viewport.height
        canvas.width = viewport.width
        context.clearRect(0, 0, canvas.width, canvas.height)

        const renderTask = page.render({
          canvasContext: context,
          viewport: viewport
        })

        renderTaskRef.current = renderTask
        await renderTask.promise
        renderTaskRef.current = null

        // Clean up
        page.cleanup()
        pdf.destroy()
        loadingTaskRef.current = null
        setIsLoading(false)
        onLoadSuccess?.()
      } catch (err) {
        if (err?.type !== 'canvas') { // Ignore canvas errors from cancellation
          console.error('Error loading PDF:', err)
          setError(true)
          onLoadError?.(err instanceof Error ? err : new Error('Failed to load preview'))
        }
        setIsLoading(false)
      }
    }

    loadPDF()

    // Cleanup function
    return () => {
      const cleanup = async () => {
        if (renderTaskRef.current) {
          await renderTaskRef.current.cancel()
          renderTaskRef.current = null
        }
        if (loadingTaskRef.current) {
          await loadingTaskRef.current.destroy()
          loadingTaskRef.current = null
        }
      }
      cleanup()
    }
  }, [url, onLoadSuccess, onLoadError, isLoaded])

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800">
        <FiFile className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800">
        <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 
          border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin">
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain"
      />
    </div>
  )
} 