'use client'

import { useEffect, useRef, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { usePDFJS } from '../contexts/PDFJSContext'

interface PDFViewerProps {
  url: string | null
  filename: string | null
  className?: string
}

export default function PDFViewer({ url, filename, className = '' }: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(1.5)
  const [pdf, setPdf] = useState<any>(null)
  const renderTaskRef = useRef<any>(null)
  const loadingTaskRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { isLoaded } = usePDFJS()
  const isMounted = useRef(true)

  // Set up mount/unmount tracking
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const cleanupCanvas = () => {
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }

  const cleanup = async () => {
    try {
      // Cancel any ongoing render task
      if (renderTaskRef.current) {
        await renderTaskRef.current.cancel()
        renderTaskRef.current = null
      }

      // Cancel any ongoing loading task
      if (loadingTaskRef.current) {
        await loadingTaskRef.current.destroy()
        loadingTaskRef.current = null
      }

      // Cleanup PDF
      if (pdf) {
        await pdf.destroy()
        if (isMounted.current) {
          setPdf(null)
          setNumPages(0)
          setCurrentPage(1)
          setScale(1.5)
          setError(null)
        }
      }

      cleanupCanvas()
    } catch (err) {
      console.error('Cleanup error:', err)
    }
  }

  const loadPDF = async () => {
    if (!canvasRef.current || !window.pdfjsLib || !isLoaded || !url || !isMounted.current) return

    try {
      setIsLoading(true)
      setError(null)

      // Clean up previous resources
      await cleanup()

      if (!isMounted.current) return

      // First check if the file exists
      const fileCheck = await fetch(`http://localhost:8000${url}`)
      if (!fileCheck.ok) {
        throw new Error(`Failed to load PDF: ${fileCheck.statusText}`)
      }

      if (!isMounted.current) return

      // Create new loading task
      loadingTaskRef.current = window.pdfjsLib.getDocument(`http://localhost:8000${url}`)
      const pdfDoc = await loadingTaskRef.current.promise

      if (!isMounted.current) {
        pdfDoc.destroy()
        return
      }

      setPdf(pdfDoc)
      setNumPages(pdfDoc.numPages)
      setCurrentPage(1)
    } catch (err) {
      if (isMounted.current) {
        console.error('Error loading PDF:', err)
        setError(err instanceof Error ? err.message : 'Failed to load PDF')
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }

  // Load PDF when component mounts or URL changes
  useEffect(() => {
    loadPDF()
    return cleanup
  }, [url, isLoaded])

  // Render page when page number changes or PDF is loaded
  useEffect(() => {
    let isCurrentRender = true

    const renderPage = async () => {
      if (!canvasRef.current || !pdf || !isMounted.current) return

      try {
        // Cancel any ongoing render task
        if (renderTaskRef.current) {
          await renderTaskRef.current.cancel()
          renderTaskRef.current = null
        }

        if (!isCurrentRender || !isMounted.current) return

        cleanupCanvas()

        const page = await pdf.getPage(currentPage)

        if (!isCurrentRender || !isMounted.current) {
          page.cleanup()
          return
        }

        const viewport = page.getViewport({ scale })
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        if (!context || !isCurrentRender || !isMounted.current) {
          page.cleanup()
          return
        }

        canvas.width = viewport.width
        canvas.height = viewport.height

        const renderTask = page.render({
          canvasContext: context,
          viewport: viewport
        })

        renderTaskRef.current = renderTask

        await renderTask.promise

        if (!isCurrentRender || !isMounted.current) {
          page.cleanup()
          return
        }

        renderTaskRef.current = null
        page.cleanup()

      } catch (err) {
        if (err?.type !== 'canvas' && isMounted.current && isCurrentRender) {
          console.error('Error rendering page:', err)
          setError('Failed to render page')
        }
      }
    }

    renderPage()

    return () => {
      isCurrentRender = false
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        renderTaskRef.current = null
      }
    }
  }, [pdf, currentPage, scale])

  const nextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3))
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5))

  if (!url) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">
          No PDF selected
        </p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
            {filename}
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {numPages > 0 ? `Page ${currentPage} of ${numPages}` : ''}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={zoomOut}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
              text-gray-500 dark:text-gray-400 disabled:opacity-50"
            title="Zoom out"
          >
            -
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
              text-gray-500 dark:text-gray-400 disabled:opacity-50"
            title="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto relative bg-gray-100 dark:bg-gray-900">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="text-red-500 dark:text-red-400 text-center mb-2">
              {error}
            </div>
            <button
              onClick={loadPDF}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading PDF...</p>
            </div>
          </div>
        ) : (
          <div className="min-h-full flex items-center justify-center p-4">
            <canvas
              ref={canvasRef}
              className="shadow-lg"
            />
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-center items-center p-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <button
            onClick={prevPage}
            disabled={currentPage <= 1 || isLoading}
            className={`p-2 rounded-full transition-colors
              ${currentPage <= 1 || isLoading
                ? 'text-gray-400 dark:text-gray-600'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem] text-center">
            {currentPage}
          </span>
          <button
            onClick={nextPage}
            disabled={currentPage >= numPages || isLoading}
            className={`p-2 rounded-full transition-colors
              ${currentPage >= numPages || isLoading
                ? 'text-gray-400 dark:text-gray-600'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
} 