'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface ThemeContextType {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Initialize theme
  useEffect(() => {
    // Remove any existing theme classes
    document.documentElement.classList.remove('dark', 'light')

    // Set initial theme
    const savedTheme = localStorage.getItem('theme')
    const initialDark = savedTheme === 'dark'

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

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
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