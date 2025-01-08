'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface ThemeContextType {
  isDarkMode: boolean
  toggleDarkMode: () => void
  fontSize: number
  setFontSize: (size: number) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [fontSize, setFontSize] = useState(16) // Default font size

  // Initialize theme and font size
  useEffect(() => {
    // Remove any existing theme classes
    document.documentElement.classList.remove('dark', 'light')

    // Set initial theme
    const savedTheme = localStorage.getItem('theme')
    const initialDark = savedTheme === 'dark'

    // Set initial font size
    const savedFontSize = localStorage.getItem('fontSize')
    if (savedFontSize) {
      setFontSize(parseInt(savedFontSize))
      document.documentElement.style.setProperty('--chat-font-size', `${savedFontSize}px`)
    } else {
      document.documentElement.style.setProperty('--chat-font-size', '16px')
    }

    setIsDarkMode(initialDark)
    document.documentElement.classList.add(initialDark ? 'dark' : 'light')
  }, [])

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newDark = !prev
      document.documentElement.classList.remove('dark', 'light')
      document.documentElement.classList.add(newDark ? 'dark' : 'light')
      localStorage.setItem('theme', newDark ? 'dark' : 'light')
      return newDark
    })
  }

  const handleSetFontSize = (size: number) => {
    setFontSize(size)
    document.documentElement.style.setProperty('--chat-font-size', `${size}px`)
    localStorage.setItem('fontSize', size.toString())
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, fontSize, setFontSize: handleSetFontSize }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 