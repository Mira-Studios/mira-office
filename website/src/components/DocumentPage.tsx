import { useEffect, useRef } from 'react'
import { DocumentBlock, DocumentPage as DocumentPageType, TextSpan } from '../types/document'

interface DocumentPageProps {
  page: DocumentPageType
  onBlocksChange: (pageId: number, blocks: DocumentBlock[]) => void
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function spansToHtml(spans: TextSpan[]): string {
  return spans
    .map(({ text, formatting }) => {
      let html = escapeHtml(text).replace(/\n/g, '<br>')
      if (formatting?.underline) html = `<u>${html}</u>`
      if (formatting?.italic) html = `<em>${html}</em>`
      if (formatting?.bold) html = `<strong>${html}</strong>`

      const styles: string[] = []
      if (formatting?.fontSize) styles.push(`font-size:${formatting.fontSize}px`)
      if (formatting?.color) styles.push(`color:${formatting.color}`)
      if (formatting?.backgroundColor) styles.push(`background-color:${formatting.backgroundColor}`)

      if (styles.length) {
        html = `<span style="${styles.join(';')}">${html}</span>`
      }

      return html
    })
    .join('')
}

function htmlToSpans(root: HTMLElement): TextSpan[] {
  const spans: TextSpan[] = []

  function walk(node: Node, fmt: TextSpan['formatting']): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? '').replace(/\u200B/g, '')
      if (text) spans.push({ text, formatting: { ...fmt } })
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return

    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()
    const style = el.style
    const computed = window.getComputedStyle(el)
    const next: TextSpan['formatting'] = { ...fmt }

    if (
      tag === 'b' ||
      tag === 'strong' ||
      style.fontWeight === 'bold' ||
      parseInt(computed.fontWeight || '400', 10) >= 700
    ) {
      next.bold = true
    }

    if (
      tag === 'i' ||
      tag === 'em' ||
      style.fontStyle === 'italic' ||
      computed.fontStyle === 'italic'
    ) {
      next.italic = true
    }

    if (
      tag === 'u' ||
      (style.textDecoration || computed.textDecorationLine || '').includes('underline')
    ) {
      next.underline = true
    }

    const fs = computed.fontSize || style.fontSize
    if (fs) {
      const parsed = parseFloat(fs)
      if (!Number.isNaN(parsed)) next.fontSize = parsed
    }

    const color = style.color || computed.color
    if (color) next.color = color

    const bg = style.backgroundColor || computed.backgroundColor
    if (bg && bg !== 'rgba(0, 0, 0, 0)') next.backgroundColor = bg

    if (tag === 'br') {
      spans.push({ text: '\n', formatting: { ...fmt } })
      return
    }

    for (const child of Array.from(el.childNodes)) {
      walk(child, next)
    }
  }

  walk(root, {})
  return spans.length > 0 ? spans : [{ text: '', formatting: {} }]
}

function blockToHtml(block: DocumentBlock): string {
  const contentHtml = spansToHtml(block.content)
  return `<div data-block-id="${block.id}" style="font-size:${block.fontSize}px;line-height:1.5;margin-bottom:12px;text-align:${block.alignment};">${contentHtml || '<br>'}</div>`
}

function pageToHtml(blocks: DocumentBlock[]): string {
  const safeBlocks = blocks.length > 0
    ? blocks
    : [{
        id: 1,
        fontSize: 14,
        content: [{ text: '', formatting: {} }],
        alignment: 'left' as const
      }]

  return safeBlocks.map(blockToHtml).join('')
}

function parseEditorBlocks(root: HTMLElement, existingBlocks: DocumentBlock[]): DocumentBlock[] {
  const childElements = Array.from(root.childNodes)
  const blocks: DocumentBlock[] = []
  let fallbackId = Math.max(0, ...existingBlocks.map(block => block.id)) + 1

  const toBlock = (element: HTMLElement, index: number) => {
    const dataId = Number(element.dataset.blockId)
    const existing = existingBlocks[index]
    const id = Number.isFinite(dataId) && dataId > 0
      ? dataId
      : existing?.id ?? fallbackId++

    const computed = window.getComputedStyle(element)
    const fontSize = parseFloat(computed.fontSize || `${existing?.fontSize ?? 14}`) || existing?.fontSize || 14
    const alignment = ((computed.textAlign || existing?.alignment || 'left') as DocumentBlock['alignment'])
    const content = htmlToSpans(element)

    return {
      id,
      fontSize,
      alignment,
      content
    }
  }

  childElements.forEach((node, index) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      blocks.push(toBlock(node as HTMLElement, index))
      return
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? '').trim()
      if (!text) return
      const existing = existingBlocks[index]
      blocks.push({
        id: existing?.id ?? fallbackId++,
        fontSize: existing?.fontSize ?? 14,
        alignment: existing?.alignment ?? 'left',
        content: [{ text, formatting: {} }]
      })
    }
  })

  return blocks.length > 0
    ? blocks
    : [{
        id: existingBlocks[0]?.id ?? 1,
        fontSize: existingBlocks[0]?.fontSize ?? 14,
        alignment: existingBlocks[0]?.alignment ?? 'left',
        content: [{ text: '', formatting: {} }]
      }]
}

export function DocumentPage({ page, onBlocksChange }: DocumentPageProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastHtmlRef = useRef('')

  const pointsToPixels = (points: number) => (points * 96) / 72

  const pageWidth = page.pageSize === 'A4' ? 794 : 816
  const pageHeight = page.pageSize === 'A4' ? 1123 : 1056

  const marginLeft = pointsToPixels(page.margins.left)
  const marginRight = pointsToPixels(page.margins.right)
  const marginTop = pointsToPixels(page.margins.top)
  const marginBottom = pointsToPixels(page.margins.bottom)

  useEffect(() => {
    const el = editorRef.current
    if (!el) return

    const nextHtml = pageToHtml(page.blocks)
    if (nextHtml !== lastHtmlRef.current) {
      el.innerHTML = nextHtml
      lastHtmlRef.current = nextHtml
    }
  }, [page.blocks])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg)'
    }}>
      <div
        style={{
          width: `${pageWidth}px`,
          height: `${pageHeight}px`,
          backgroundColor: 'white',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <div
          ref={editorRef}
          data-rich-editor="true"
          contentEditable
          suppressContentEditableWarning
          spellCheck
          style={{
            position: 'absolute',
            top: `${marginTop}px`,
            left: `${marginLeft}px`,
            right: `${marginRight}px`,
            bottom: `${marginBottom}px`,
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#000000',
            outline: 'none',
            border: 'none',
            padding: '0',
            backgroundColor: 'transparent',
            caretColor: '#000000',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            boxSizing: 'border-box'
          }}
          onInput={(e) => {
            const root = e.currentTarget
            lastHtmlRef.current = root.innerHTML
            onBlocksChange(page.id, parseEditorBlocks(root, page.blocks))
          }}
        />
      </div>
    </div>
  )
}
