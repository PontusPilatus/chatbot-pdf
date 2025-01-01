'use client'

import { useState } from 'react'
import FileUpload from './components/FileUpload'

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const handleFileUpload = (file: File) => {
    setUploadedFile(file)
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          PDF Chatbot
        </h1>

        {/* File Upload Section */}
        <div className="mb-8 p-8 bg-white rounded-lg shadow-md">
          <FileUpload onFileUpload={handleFileUpload} />
          {uploadedFile && (
            <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
              Successfully uploaded: {uploadedFile.name}
            </div>
          )}
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="h-[400px] border-b border-gray-200 mb-4 p-4 overflow-y-auto">
            {/* Messages will go here */}
            <div className="text-center text-gray-500 mt-32">
              {uploadedFile
                ? "Ask questions about your PDF"
                : "Upload a PDF to start chatting about its contents"}
            </div>
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask a question about your PDF..."
              className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!uploadedFile}
            />
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300"
              disabled={!uploadedFile}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
