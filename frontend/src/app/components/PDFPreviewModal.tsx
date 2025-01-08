'use client'

import { useEffect, useRef, useState } from 'react'
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import Script from 'next/script'

// Use the stable version of PDF.js from CDN
const PDFJS_VERSION = '3.11.174'
const PDFJS_URL = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`
const WORKER_URL = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`

interface PDFPreviewModalProps {
  url: string
  filename: string
  onClose: () => void
}

export default function PDFPreviewModal({ url, filename, onClose }: PDFPreviewModalProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(1.5)
  const [pdf, setPdf] = useState<any>(null)
  const renderTaskRef = useRef<any>(null)
  const [pdfJSLoaded, setPdfJSLoaded] = useState(false)

  // Load PDF when component mounts
  useEffect(() => {
    const loadPDF = async () => {
      if (!canvasRef.current || !window.pdfjsLib || !pdfJSLoaded) return

      try {
        // Set worker source
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL

        const loadingTask = window.pdfjsLib.getDocument(`http://localhost:8000${url}`)
        const pdfDoc = await loadingTask.promise
        setPdf(pdfDoc)
        setNumPages(pdfDoc.numPages)
      } catch (err) {
        console.error('Error loading PDF:', err)
        setError('Failed to load PDF preview')
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

  return (
    <>
      <Script
        src={PDFJS_URL}
        onLoad={() => setPdfJSLoaded(true)}
        onError={() => setError('Failed to load PDF viewer')}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="relative w-full max-w-4xl h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {filename}
              </h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage} of {numPages}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={zoomOut}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                  text-gray-500 dark:text-gray-400"
                title="Zoom out"
              >
                -
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                  text-gray-500 dark:text-gray-400"
                title="Zoom in"
              >
                +
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                  text-gray-500 dark:text-gray-400"
                title="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-auto relative bg-gray-100 dark:bg-gray-900">
            {error ? (
              <div className="flex items-center justify-center h-full text-red-500 dark:text-red-400">
                {error}
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

          {/* Fixed Navigation Controls */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center pointer-events-none">
            <div className="flex items-center space-x-3 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg p-2 backdrop-blur-sm pointer-events-auto">
              <button
                onClick={prevPage}
                disabled={currentPage <= 1}
                className={`p-2 rounded-full transition-colors
                  ${currentPage <= 1
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
                disabled={currentPage >= numPages}
                className={`p-2 rounded-full transition-colors
                  ${currentPage >= numPages
                    ? 'text-gray-400 dark:text-gray-600'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 