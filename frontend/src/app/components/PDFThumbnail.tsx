'use client'

import { useEffect, useRef, useState } from 'react'
import { FiFile } from 'react-icons/fi'
import Script from 'next/script'

// Use the stable version of PDF.js from CDN
const PDFJS_VERSION = '3.11.174'
const PDFJS_URL = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`
const WORKER_URL = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`

interface PDFThumbnailProps {
  url: string
  width?: number
  onLoadSuccess?: () => void
  onLoadError?: (error: Error) => void
}

export default function PDFThumbnail({ url, width = 100, onLoadSuccess, onLoadError }: PDFThumbnailProps) {
  const [error, setError] = useState(false)
  const [pdfJSLoaded, setPdfJSLoaded] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const loadPDF = async () => {
      if (!canvasRef.current || !pdfJSLoaded || !window.pdfjsLib) return

      try {
        // Set worker source
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL

        const loadingTask = window.pdfjsLib.getDocument(`http://localhost:8000${url}`)
        const pdf = await loadingTask.promise
        const page = await pdf.getPage(1)

        const viewport = page.getViewport({ scale: 0.5 })
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        if (!context) return

        canvas.height = viewport.height
        canvas.width = viewport.width

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise

        onLoadSuccess?.()
      } catch (err) {
        console.error('Error loading PDF:', err)
        setError(true)
        onLoadError?.(err instanceof Error ? err : new Error('Failed to load preview'))
      }
    }

    loadPDF()
  }, [url, onLoadSuccess, onLoadError, pdfJSLoaded])

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800">
        <FiFile className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
    )
  }

  return (
    <>
      <Script
        src={PDFJS_URL}
        onLoad={() => setPdfJSLoaded(true)}
        onError={() => setError(true)}
      />
      <div className="relative w-full h-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
        />
      </div>
    </>
  )
} 