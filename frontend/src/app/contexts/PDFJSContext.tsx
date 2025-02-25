'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

// Use the stable version of PDF.js from CDN
const PDFJS_VERSION = '3.11.174'
const PDFJS_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`
const WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`

interface PDFJSContextType {
  isLoaded: boolean
  error: string | null
}

const PDFJSContext = createContext<PDFJSContextType>({
  isLoaded: false,
  error: null
})

export function PDFJSProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if script is already loaded
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL
      setIsLoaded(true)
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(`script[src="${PDFJS_URL}"]`)
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL
          setIsLoaded(true)
        }
      })
      return
    }

    // Load PDF.js script if not already loaded or loading
    const script = document.createElement('script')
    script.src = PDFJS_URL
    script.async = true
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL
        setIsLoaded(true)
      }
    }
    script.onerror = () => {
      setError('Failed to load PDF viewer')
    }

    document.body.appendChild(script)

    // Don't remove the script on cleanup
  }, [])

  return (
    <PDFJSContext.Provider value={{ isLoaded, error }}>
      {children}
    </PDFJSContext.Provider>
  )
}

export function usePDFJS() {
  return useContext(PDFJSContext)
} 