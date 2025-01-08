'use client'

import { ThemeProvider } from './contexts/ThemeContext'
import { PDFJSProvider } from './contexts/PDFJSContext'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <PDFJSProvider>
        {children}
      </PDFJSProvider>
    </ThemeProvider>
  )
} 