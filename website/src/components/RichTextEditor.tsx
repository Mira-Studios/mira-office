import React, { useRef, useEffect, useCallback } from 'react'
import { TextSpan, DocumentBlock } from '../types/document'

interface RichTextEditorProps {
  block: DocumentBlock
  onChange: (block: DocumentBlock) => void
  onFocus: () => void
  onNewBlock?: () => void
  placeholder?: string
}

// ─── Serialization helpers ────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function spansToHtml(spans: TextSpan[]): string {
  return spans
    .map(({ text, formatting }) => {
      let html = escapeHtml(text)
      if (formatting?.underline) html = `<u>${html}</u>`
      if (formatting?.italic)    html = `<em>${html}</em>`
      if (formatting?.bold)      html = `<strong>${html}</strong>`

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

/**
 * Walk the DOM and collect (text, formatting) pairs.
 * We inherit formatting from ancestor elements, so nested tags like
 * <strong><em>hi</em></strong> correctly produce { bold:true, italic:true }.
 */
function htmlToSpans(root: HTMLElement): TextSpan[] {
  const spans: TextSpan[] = []

  function walk(node: Node, fmt: TextSpan['formatting']): void {
    if (node.nodeType === Node.TEXT_NODE) {
      let text = node.textContent ?? ''
      // Remove zero-width markers inserted to position the caret
      text = text.replace(/\u200B/g, '')
      if (text) spans.push({ text, formatting: { ...fmt } })
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return

    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()
    const style = el.style
    const computed = window.getComputedStyle(el)

    const next: TextSpan['formatting'] = { ...fmt }

    const isBold =
      tag === 'b' ||
      tag === 'strong' ||
      style.fontWeight === 'bold' ||
      parseInt(computed.fontWeight, 10) >= 700

    const isItalic =
      tag === 'i' ||
      tag === 'em' ||
      style.fontStyle === 'italic' ||
      computed.fontStyle === 'italic'

    const isUnderline =
      tag === 'u' ||
      (style.textDecoration || computed.textDecorationLine || '').includes('underline')

    if (isBold)      next.bold      = true
    if (isItalic)    next.italic    = true
    if (isUnderline) next.underline = true

    // Detect inline font-size, color and background if present
    try {
      const fs = computed.fontSize || style.fontSize
      if (fs) {
        const parsed = parseFloat(fs)
        if (!Number.isNaN(parsed)) next.fontSize = parsed
      }

      const color = style.color || computed.color
      if (color) next.color = color

      const bg = style.backgroundColor || computed.backgroundColor
      if (bg && bg !== 'rgba(0, 0, 0, 0)') next.backgroundColor = bg
    } catch (err) {
      // ignore computed style errors in unusual environments
    }

    // <br> is a line break — treat as newline text
    if (tag === 'br') {
      spans.push({ text: '\n', formatting: { ...fmt } })
      return
    }

    // Block-level elements add implicit newlines between them
    const isBlock = /^(p|div|li|blockquote|h[1-6])$/.test(tag)
    if (isBlock && spans.length > 0) {
      const last = spans[spans.length - 1]
      if (!last.text.endsWith('\n')) {
        spans.push({ text: '\n', formatting: {} })
      }
    }

    for (const child of Array.from(node.childNodes)) {
      walk(child, next)
    }
  }

  walk(root, {})
  return spans.length > 0 ? spans : [{ text: '', formatting: {} }]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RichTextEditor({
  block,
  onChange,
  onFocus,
  onNewBlock,
  placeholder = 'Start typing…',
}: RichTextEditorProps) {
  const editorRef      = useRef<HTMLDivElement>(null)
  const isFocusedRef   = useRef(false)
  const lastBlockIdRef = useRef<string | undefined>(undefined)

  // ── Mount / block-switch: set innerHTML once, never again while typing ──────
  useEffect(() => {
    const el = editorRef.current
    if (!el) return

    // Only rewrite the DOM when we're switching to a different block,
    // or on first mount. NEVER while the user is actively typing —
    // that would teleport the cursor back to position 0.
    if (lastBlockIdRef.current !== block.id) {
      el.innerHTML = spansToHtml(block.content)
      lastBlockIdRef.current = block.id
    }
  }, [block.id]) // intentionally omit block.content — we own the DOM while focused

  // ── Serialize DOM → spans, push to parent ───────────────────────────────────
  const syncContent = useCallback(() => {
    if (!editorRef.current) return
    const spans = htmlToSpans(editorRef.current)
    onChange({ ...block, content: spans })
  }, [block, onChange])

  // ── Formatting via execCommand (the only reliable cross-browser approach) ───
  const applyFormat = useCallback((cmd: 'bold' | 'italic' | 'underline') => {
    // execCommand preserves the selection, handles nested tags, and is
    // battle-tested in every browser — far more reliable than manual DOM surgery.
    document.execCommand(cmd, false)
    syncContent()
  }, [syncContent])

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const mod = e.metaKey || e.ctrlKey

    if (mod) {
      switch (e.key.toLowerCase()) {
        case 'b': e.preventDefault(); applyFormat('bold');      return
        case 'i': e.preventDefault(); applyFormat('italic');    return
        case 'u': e.preventDefault(); applyFormat('underline'); return
      }
    }

    // Enter → create a new block (parent decides layout).
    // Remove this if you want the default <div>/<br> split behaviour.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onNewBlock?.()
    }
  }, [applyFormat, onNewBlock])

  // ── Paste: strip HTML, insert plain text so pasted content uses local style ─
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const plain = e.clipboardData.getData('text/plain')
    // insertText keeps the undo stack intact
    document.execCommand('insertText', false, plain)
    syncContent()
  }, [syncContent])

  // ── Placeholder visibility ───────────────────────────────────────────────────
  const isEmpty = block.content.every(s => !s.text)

  return (
    <div style={{ position: 'relative', width: '100%' }}>

      {/* CSS-driven placeholder — zero JS, never interferes with editing */}
      {isEmpty && (
        <span
          aria-hidden="true"
          style={{
            position:      'absolute',
            inset:         0,
            padding:       '4px',
            color:         '#aaa',
            fontSize:      '14px',
            lineHeight:    '1.5',
            pointerEvents: 'none',
            userSelect:    'none',
          }}
        >
          {placeholder}
        </span>
      )}

      <div
        ref={editorRef}
        data-rich-editor="true"
        contentEditable
        suppressContentEditableWarning
        spellCheck
        style={{
          minHeight:       '24px',
          outline:         'none',
          padding:         '4px',
          width:           '100%',
          color:           '#000',
          fontSize:        `${block.fontSize}px`,
          lineHeight:      '1.5',
          textAlign:       block.alignment,
          backgroundColor: 'transparent',
          caretColor:      '#000',
          wordBreak:       'break-word',
          whiteSpace:      'pre-wrap',
        }}
        onInput={syncContent}          // fires after every DOM mutation
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={() => {
          isFocusedRef.current = true
          onFocus()
        }}
        onBlur={() => {
          isFocusedRef.current = false
          syncContent()               // final sync when leaving the field
        }}
      />
    </div>
  )
}