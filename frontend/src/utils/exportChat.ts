import { ChatMessage } from '@/types/chat'

export function convertToMarkdown(messages: ChatMessage[], activePDF: string | null): string {
  const lines = [
    '# EVA Chat Export',
    '',
    `Generated on: ${new Date().toLocaleString()}`,
    '',
  ]

  if (activePDF) {
    lines.push(`Active PDF: ${activePDF}`, '')
  }

  messages.forEach(message => {
    const timestamp = new Date(message.timestamp).toLocaleString()
    const role = message.role === 'user' ? '👤 **You**' : '🤖 **EVA**'
    lines.push(`### ${role} - ${timestamp}`, '', message.content, '')
  })

  return lines.join('\n')
}

export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
} 