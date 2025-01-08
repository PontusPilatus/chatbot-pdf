import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from './contexts/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PDF Pal',
  description: 'Chat with your PDF documents using AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Force remove dark mode first
                document.documentElement.classList.remove('dark')
                document.documentElement.classList.add('light')
                
                // Only switch to dark if explicitly set
                const theme = localStorage.getItem('theme')
                if (theme === 'dark') {
                  document.documentElement.classList.remove('light')
                  document.documentElement.classList.add('dark')
                } else {
                  localStorage.setItem('theme', 'light')
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased transition-colors duration-200`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
