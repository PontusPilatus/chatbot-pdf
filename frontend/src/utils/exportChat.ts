import { ChatMessage } from '@/types/chat'

export function convertToMarkdown(messages: ChatMessage[], activePDF: string | null): string {
  const timestamp = new Date().toLocaleString()
  const header = [
    '# PDF Pal Chat Export',
    '',
    `**Date:** ${timestamp}`,
    activePDF ? `**Document:** ${activePDF}` : '**Document:** No document loaded',
    '',
    '---',
    ''
  ].join('\n')

  const content = messages.map(message => {
    const role = message.role === 'user' ? '👤 **You**' : '🤖 **PDF Pal**'
    const time = new Date(message.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })

    return [
      `### ${role} (${time})`,
      '',
      message.content.split('\n').map(line => {
        // Handle bullet points
        if (line.startsWith('•')) return `* ${line.slice(1).trim()}`
        // Handle numbered lists
        if (line.match(/^\d+[\.\)]/) || line.match(/^[①-⑳]/)) return `1. ${line.replace(/^[①-⑳]|\d+[\.\)]/, '').trim()}`
        return line
      }).join('\n'),
      ''
    ].join('\n')
  }).join('\n')

  return header + content
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