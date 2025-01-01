import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PDF Chatbot',
  description: 'Chat with your PDF documents using AI',
}

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          PDF Chatbot
        </h1>

        {/* File Upload Section */}
        <div className="mb-8 p-8 bg-white rounded-lg shadow-md">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">Drag and drop your PDF here, or</p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
              Choose File
            </button>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="h-[400px] border-b border-gray-200 mb-4 p-4 overflow-y-auto">
            {/* Messages will go here */}
            <div className="text-center text-gray-500 mt-32">
              Upload a PDF to start chatting about its contents
            </div>
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask a question about your PDF..."
              className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled
            />
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300"
              disabled
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
