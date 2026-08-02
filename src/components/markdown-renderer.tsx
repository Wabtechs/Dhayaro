import React from 'react'

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    const codeMatch = remaining.match(/^`([^`]+)`/)
    if (codeMatch) {
      parts.push(<code key={key++} className="text-indigo-600 dark:text-indigo-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">{escapeHtml(codeMatch[1])}</code>)
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }

    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/)
    if (boldMatch) {
      parts.push(<strong key={key++} className="font-semibold text-gray-900 dark:text-gray-100">{boldMatch[1]}</strong>)
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    const italicMatch = remaining.match(/^\*([^*]+)\*/)
    if (italicMatch) {
      parts.push(<em key={key++} className="italic">{italicMatch[1]}</em>)
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch) {
      parts.push(<a key={key++} href={linkMatch[2]} className="text-indigo-600 dark:text-indigo-400 hover:underline">{linkMatch[1]}</a>)
      remaining = remaining.slice(linkMatch[0].length)
      continue
    }

    const char = remaining[0]
    parts.push(char)
    remaining = remaining.slice(1)
  }

  return parts
}

function tokenizeLine(line: string): { indent: number; prefix: string; text: string } {
  const indent = line.match(/^ */)?.[0].length ?? 0
  const trimmed = line.trimStart()
  return { indent, prefix: '', text: trimmed }
}

function renderTable(rows: string[][]): React.ReactNode {
  if (rows.length < 2) return null
  const [header, , ...data] = rows
  return (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {header.map((h, i) => <th key={i} className="text-left py-2 pr-4 font-semibold text-gray-900 dark:text-gray-100">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr key={ri} className="border-b border-gray-100 dark:border-gray-800">
              {row.map((cell, ci) => <td key={ci} className="py-2 pr-4 text-gray-600 dark:text-gray-400">{parseInline(cell)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface RenderContext {
  inTable: boolean
  tableRows: string[][]
}

export function MarkdownRenderer({ children }: { children: string }) {
  const lines = children.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0
  const ctx: RenderContext = { inTable: false, tableRows: [] }

  function flushTable() {
    if (ctx.tableRows.length > 0) {
      elements.push(<React.Fragment key={key++}>{renderTable(ctx.tableRows)}</React.Fragment>)
      ctx.tableRows = []
    }
    ctx.inTable = false
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed === '') { flushTable(); continue }

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      ctx.inTable = true
      const cells = trimmed.split('|').filter(Boolean).map(c => c.trim())
      if (cells.every(c => /^:?-+:?$/.test(c.replace(/\s/g, '')))) continue
      ctx.tableRows.push(cells)
      continue
    }

    flushTable()

    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      const code = codeLines.join('\n')
      elements.push(
        <pre key={key++} className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto leading-relaxed mb-4">
          <code>{code}</code>
        </pre>
      )
      continue
    }

    if (trimmed.startsWith('###### ')) {
      elements.push(<h6 key={key++} className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-1">{trimmed.slice(7)}</h6>)
      continue
    }
    if (trimmed.startsWith('##### ')) {
      elements.push(<h5 key={key++} className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">{trimmed.slice(6)}</h5>)
      continue
    }
    if (trimmed.startsWith('#### ')) {
      elements.push(<h4 key={key++} className="text-base font-bold text-gray-900 dark:text-gray-100 mt-4 mb-2">{trimmed.slice(5)}</h4>)
      continue
    }
    if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={key++} className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">{trimmed.slice(4)}</h3>)
      continue
    }
    if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={key++} className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-3">{trimmed.slice(3)}</h2>)
      continue
    }
    if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={key++} className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{trimmed.slice(2)}</h1>)
      continue
    }

    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={key++} className="border-l-4 border-indigo-500 pl-4 italic text-gray-600 dark:text-gray-400 mb-4">
          {parseInline(trimmed.slice(2))}
        </blockquote>
      )
      continue
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items: React.ReactNode[] = [parseInline(trimmed.slice(2))]
      while (i + 1 < lines.length && (lines[i + 1].trimStart().startsWith('- ') || lines[i + 1].trimStart().startsWith('* '))) {
        i++
        items.push(parseInline(lines[i].trimStart().slice(2)))
      }
      elements.push(
        <ul key={key++} className="space-y-1.5 text-gray-600 dark:text-gray-400 list-disc list-inside mb-4">
          {items.map((item, idx) => <li key={idx}>{item}</li>)}
        </ul>
      )
      continue
    }

    elements.push(
      <p key={key++} className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
        {parseInline(trimmed)}
      </p>
    )
  }

  flushTable()
  return <>{elements}</>
}
