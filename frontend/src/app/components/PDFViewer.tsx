'use client'

import { useEffect, useRef, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import Script from 'next/script'

// Use the stable version of PDF.js from CDN
const PDFJS_VERSION = '3.11.174'
const PDFJS_URL = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`
const WORKER_URL = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`

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
  const [pdfJSLoaded, setPdfJSLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load PDF when component mounts or URL changes
  useEffect(() => {
    const loadPDF = async () => {
      if (!canvasRef.current || !window.pdfjsLib || !pdfJSLoaded || !url) return

      try {
        setIsLoading(true)
        setError(null)

        // Set worker source
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL

        // First check if the file exists
        const fileCheck = await fetch(`http://localhost:8000${url}`)
        if (!fileCheck.ok) {
          throw new Error(`Failed to load PDF: ${fileCheck.statusText}`)
        }

        const loadingTask = window.pdfjsLib.getDocument(`http://localhost:8000${url}`)
        const pdfDoc = await loadingTask.promise
        setPdf(pdfDoc)
        setNumPages(pdfDoc.numPages)
        setCurrentPage(1) // Reset to first page when loading new PDF
      } catch (err) {
        console.error('Error loading PDF:', err)
        setError(err instanceof Error ? err.message : 'Failed to load PDF')
      } finally {
        setIsLoading(false)
      }
    }

    loadPDF()

    // Cleanup
    return () => {
      if (pdf) {
        pdf.destroy()
      }
    }
  }, [url, pdfJSLoaded])

  // Render page when page number changes or PDF is loaded
  useEffect(() => {
    const renderPage = async () => {
      if (!canvasRef.current || !pdf) return

      try {
        // Cancel any ongoing render task
        if (renderTaskRef.current) {
          await renderTaskRef.current.cancel()
          renderTaskRef.current = null
        }

        const page = await pdf.getPage(currentPage)
        const viewport = page.getViewport({ scale })
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        if (!context) return

        // Clear previous content and reset canvas
        canvas.width = viewport.width
        canvas.height = viewport.height
        context.clearRect(0, 0, canvas.width, canvas.height)

        const renderTask = page.render({
          canvasContext: context,
          viewport: viewport
        })

        renderTaskRef.current = renderTask

        await renderTask.promise
        renderTaskRef.current = null

        // Release page resources
        page.cleanup()

      } catch (err) {
        if (err?.type !== 'canvas') { // Ignore canvas errors from cancellation
          console.error('Error rendering page:', err)
          setError('Failed to render page')
        }
      }
    }

    renderPage()

    // Cleanup function
    return () => {
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
    <>
      <Script
        src={PDFJS_URL}
        onLoad={() => setPdfJSLoaded(true)}
        onError={() => setError('Failed to load PDF viewer')}
      />
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
                onClick={() => {
                  setError(null)
                  if (url) {
                    const loadingTask = window.pdfjsLib.getDocument(`http://localhost:8000${url}`)
                    loadingTask.promise.then(pdfDoc => {
                      setPdf(pdfDoc)
                      setNumPages(pdfDoc.numPages)
                    }).catch(err => {
                      setError(err instanceof Error ? err.message : 'Failed to load PDF')
                    })
                  }
                }}
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
    </>
  )
} 