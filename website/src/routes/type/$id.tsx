import { createFileRoute } from '@tanstack/react-router'
import { Save, Download, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, ZoomIn, ZoomOut, Undo, Redo, Palette, Highlighter, List, ListOrdered, BetweenVerticalEnd } from 'lucide-react'
import { useToolbar } from '../../contexts/ToolbarContext'
import { useDocument } from '../../contexts/DocumentContext'
import { useEffect, useState, useRef } from 'react'
import { DocumentPage } from '../../components/DocumentPage'
import { DocumentBlock } from '../../types/document'

export const Route = createFileRoute('/type/$id')({
  component: TypeIdComponent,
})

function TypeIdComponent() {
  const { id } = Route.useParams()
  const { setToolbar } = useToolbar()
  const { document: doc, setPageBlocks } = useDocument()
  const [zoomLevel, setZoomLevel] = useState(100)
  
  console.log('TypeIdComponent rendered with ID:', id)
  
  useEffect(() => {
    // Render a dedicated toolbar component into the shared ToolbarContext.
    function TypeToolbar() {
      const { document: doc, updateTitle: doUpdateTitle, exportDocument: doExport } = useDocument()
      const [titleLocal, setTitleLocal] = useState(doc.metadata.title)
      const [fontSizeValue, setFontSizeValue] = useState<number>(14)
      const [selectedFont, setSelectedFont] = useState<string>('Arial')
      const [isBold, setIsBold] = useState(false)
      const [isItalic, setIsItalic] = useState(false)
      const [isUnderline, setIsUnderline] = useState(false)
      const [history, setHistory] = useState<string[]>([])
      const [historyIndex, setHistoryIndex] = useState(-1)
      const historyRef = useRef<string[]>([])
      const historyIndexRef = useRef(-1)
      const inputRef = useRef<HTMLInputElement | null>(null)

      // Keep refs in sync with state
      useEffect(() => { historyRef.current = history }, [history])
      useEffect(() => { historyIndexRef.current = historyIndex }, [historyIndex])

      useEffect(() => {
        setTitleLocal(doc.metadata.title)
      }, [doc.metadata.title])

      // Set up history tracking for the editor
      useEffect(() => {
        const el = window.document.querySelector('[data-rich-editor]') as HTMLElement | null
        if (!el) return

        // Initialize history with current content
        setHistory([el.innerHTML])
        setHistoryIndex(0)
        historyRef.current = [el.innerHTML]
        historyIndexRef.current = 0

        // Debounce input to avoid saving every keystroke
        let timeout: ReturnType<typeof setTimeout> | null = null
        const debouncedInput = () => {
          if (timeout) clearTimeout(timeout)
          timeout = setTimeout(() => {
            const currentContent = el.innerHTML
            const prev = historyRef.current
            const currentIdx = historyIndexRef.current
            
            // Don't add duplicate consecutive entries
            if (prev.length > 0 && prev[prev.length - 1] === currentContent) {
              return
            }
            
            // Truncate redo states and add new state
            const newHistory = prev.slice(0, currentIdx + 1)
            newHistory.push(currentContent)
            
            // Limit to 50 entries
            if (newHistory.length > 50) {
              newHistory.shift()
              historyRef.current = newHistory
              historyIndexRef.current = 49
              setHistory(newHistory)
              setHistoryIndex(49)
            } else {
              historyRef.current = newHistory
              historyIndexRef.current = newHistory.length - 1
              setHistory(newHistory)
              setHistoryIndex(newHistory.length - 1)
            }
          }, 300)
        }

        el.addEventListener('input', debouncedInput)
        return () => {
          el.removeEventListener('input', debouncedInput)
          if (timeout) clearTimeout(timeout)
        }
      }, []) // Run once on mount

      const triggerEditorInput = () => {
        const el = window.document.querySelector('[data-rich-editor]') as HTMLElement | null
        if (el) {
          // Just dispatch input event to sync state - history is tracked separately
          el.dispatchEvent(new InputEvent('input', { bubbles: true }))
        }
      }

      const saveToHistory = () => {
        const el = window.document.querySelector('[data-rich-editor]') as HTMLElement | null
        if (!el) return
        
        const currentContent = el.innerHTML
        setHistory(prev => {
          // Truncate any redo states and add new state
          const newHistory = prev.slice(0, historyIndex + 1)
          // Don't add duplicate
          if (newHistory.length > 0 && newHistory[newHistory.length - 1] === currentContent) {
            return prev
          }
          newHistory.push(currentContent)
          // Limit to 50 entries
          if (newHistory.length > 50) {
            newHistory.shift()
            setHistoryIndex(48)
            return newHistory
          }
          setHistoryIndex(newHistory.length - 1)
          return newHistory
        })
      }

      

      const updateActiveState = () => {
        const sel = window.getSelection()
        if (!sel || sel.rangeCount === 0) {
          setIsBold(false); setIsItalic(false); setIsUnderline(false)
          return
        }
        try {
          const node = (sel.focusNode && sel.focusNode.nodeType === Node.TEXT_NODE)
            ? (sel.focusNode as Text).parentElement
            : (sel.focusNode as HTMLElement | null)

          if (!node) return

          const computed = window.getComputedStyle(node)

          const bold = (window.document.queryCommandState && window.document.queryCommandState('bold')) || parseInt(computed.fontWeight || '400', 10) >= 700 || !!node.closest('strong')
          const italic = (window.document.queryCommandState && window.document.queryCommandState('italic')) || computed.fontStyle === 'italic' || !!node.closest('em')
          const underline = (window.document.queryCommandState && window.document.queryCommandState('underline')) || (computed.textDecorationLine || '').includes('underline') || !!node.closest('u')

          setIsBold(Boolean(bold))
          setIsItalic(Boolean(italic))
          setIsUnderline(Boolean(underline))

          // Derive font size from nearest ancestor with a computable font-size
          let el: HTMLElement | null = node
          let found: number | undefined
          while (el && el !== window.document.body) {
            const fs = window.getComputedStyle(el).fontSize
            if (fs) {
              const parsed = parseFloat(fs)
              if (!Number.isNaN(parsed)) { found = parsed; break }
            }
            el = el.parentElement
          }

          // Avoid clobbering typed input while the font-size input has focus
          if (found) {
            if (window.document.activeElement !== inputRef.current) {
              setFontSizeValue(Math.round(found))
            }
          }
        } catch (err) {
          // ignore
        }
      }

      useEffect(() => {
        window.document.addEventListener('selectionchange', updateActiveState)
        // initial read
        updateActiveState()
        return () => window.document.removeEventListener('selectionchange', updateActiveState)
      }, [])

      const applyFormat = (cmd: 'bold' | 'italic' | 'underline') => {
        triggerEditorInput()
        window.document.execCommand(cmd, false)
        updateActiveState()
      }

      const applyFont = (fontFamily: string) => {
        const sel = window.getSelection()
        try {
          if (!sel || sel.rangeCount === 0) {
            return
          }

          const range = sel.getRangeAt(0)

          if (range.collapsed) {
            const span = window.document.createElement('span')
            span.style.fontFamily = fontFamily
            span.appendChild(window.document.createTextNode('\u200B'))
            range.insertNode(span)
            const newRange = window.document.createRange()
            newRange.setStart(span.firstChild!, 1)
            newRange.collapse(true)
            sel.removeAllRanges()
            sel.addRange(newRange)
          } else {
            const content = range.extractContents()
            const span = window.document.createElement('span')
            span.style.fontFamily = fontFamily
            span.appendChild(content)
            range.insertNode(span)
            const newRange = window.document.createRange()
            newRange.setStart(span, span.childNodes.length)
            newRange.collapse(true)
            sel.removeAllRanges()
            sel.addRange(newRange)
          }

          triggerEditorInput()
          setSelectedFont(fontFamily)
        } catch (err) {
          // ignore
        }
      }

      const applyTextColor = (color: string) => {
        triggerEditorInput()
        window.document.execCommand('foreColor', false, color)
      }

      const applyHighlightColor = (color: string) => {
        triggerEditorInput()
        window.document.execCommand('hiliteColor', false, color)
      }

      // Save current selection/cursor position
      const saveSelection = (): Range | null => {
        const sel = window.getSelection()
        if (!sel || sel.rangeCount === 0) return null
        return sel.getRangeAt(0).cloneRange()
      }

      // Restore selection/cursor position
      const restoreSelection = (range: Range | null) => {
        if (!range) return
        const sel = window.getSelection()
        if (!sel) return
        sel.removeAllRanges()
        sel.addRange(range)
      }

      const undo = () => {
        if (historyIndexRef.current > 0) {
          const el = window.document.querySelector('[data-rich-editor]') as HTMLElement | null
          if (el) {
            const newIndex = historyIndexRef.current - 1
            const newContent = historyRef.current[newIndex]
            
            // Restore content
            el.innerHTML = newContent
            
            // Update state and refs
            setHistoryIndex(newIndex)
            historyIndexRef.current = newIndex
            
            // Sync state with parent without adding to history
            el.dispatchEvent(new InputEvent('input', { bubbles: true }))
            
            // Try to place cursor at end if possible
            try {
              const range = document.createRange()
              range.selectNodeContents(el)
              range.collapse(false)
              const sel = window.getSelection()
              sel?.removeAllRanges()
              sel?.addRange(range)
            } catch (e) {
              // ignore
            }
          }
        }
      }

      const redo = () => {
        if (historyIndexRef.current < historyRef.current.length - 1) {
          const el = window.document.querySelector('[data-rich-editor]') as HTMLElement | null
          if (el) {
            const newIndex = historyIndexRef.current + 1
            const newContent = historyRef.current[newIndex]
            
            // Restore content
            el.innerHTML = newContent
            
            // Update state and refs
            setHistoryIndex(newIndex)
            historyIndexRef.current = newIndex
            
            // Sync state with parent without adding to history
            el.dispatchEvent(new InputEvent('input', { bubbles: true }))
            
            // Try to place cursor at end if possible
            try {
              const range = document.createRange()
              range.selectNodeContents(el)
              range.collapse(false)
              const sel = window.getSelection()
              sel?.removeAllRanges()
              sel?.addRange(range)
            } catch (e) {
              // ignore
            }
          }
        }
      }

      const applyFontSize = (px: number) => {
        if (!px || Number.isNaN(px)) return
        const sel = window.getSelection()
        try {
          if (!sel || sel.rangeCount === 0) {
            return
          }

          const range = sel.getRangeAt(0)

          if (range.collapsed) {
            const span = window.document.createElement('span')
            span.style.fontSize = `${px}px`
            span.appendChild(window.document.createTextNode('\u200B'))
            range.insertNode(span)
            const newRange = window.document.createRange()
            newRange.setStart(span.firstChild!, 1)
            newRange.collapse(true)
            sel.removeAllRanges()
            sel.addRange(newRange)
          } else {
            const content = range.extractContents()
            const span = window.document.createElement('span')
            span.style.fontSize = `${px}px`
            span.appendChild(content)
            range.insertNode(span)
            const newRange = window.document.createRange()
            newRange.setStart(span, span.childNodes.length)
            newRange.collapse(true)
            sel.removeAllRanges()
            sel.addRange(newRange)
          }

          triggerEditorInput()
          updateActiveState()
        } catch (err) {
          // ignore
        }
      }

      const applyAlignment = (alignment: 'left' | 'center' | 'right') => {
        const el = window.document.querySelector('[data-rich-editor]') as HTMLElement | null
        if (!el) return

        const sel = window.getSelection()
        if (!sel || sel.rangeCount === 0) return

        // Find the block element containing the selection
        let node = sel.anchorNode as Node | null
        while (node && node !== el) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement
            // Check if this is a block-level element
            if (element.tagName === 'DIV' || element.style.textAlign) {
              element.style.textAlign = alignment
              triggerEditorInput()
              return
            }
          }
          node = node.parentNode
        }

        // If no block found, apply to the closest div inside the editor
        if (node === el) {
          // Selection is at root level, find or create a div
          const range = sel.getRangeAt(0)
          let container = range.commonAncestorContainer as HTMLElement
          if (container.nodeType === Node.TEXT_NODE) {
            container = container.parentElement as HTMLElement
          }
          if (container && container !== el) {
            container.style.textAlign = alignment
            triggerEditorInput()
          }
        }
      }

      const applyList = (ordered: boolean) => {
        triggerEditorInput()
        document.execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList', false)
        updateActiveState()
      }

      const applyLineSpacing = () => {
        const el = window.document.querySelector('[data-rich-editor]') as HTMLElement | null
        if (!el) return

        const sel = window.getSelection()
        if (!sel || sel.rangeCount === 0) return

        let node = sel.anchorNode as Node | null
        while (node && node !== el) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement
            const currentSpacing = element.style.lineHeight
            // Cycle through spacing options
            if (!currentSpacing || currentSpacing === '1.5') {
              element.style.lineHeight = '2'
            } else if (currentSpacing === '2') {
              element.style.lineHeight = '1'
            } else {
              element.style.lineHeight = '1.5'
            }
            triggerEditorInput()
            return
          }
          node = node.parentNode
        }
      }

      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <input
            type="text"
            placeholder="Document Title"
            value={titleLocal}
            onChange={(e) => setTitleLocal(e.target.value)}
            onBlur={() => doUpdateTitle(titleLocal)}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--text)',
              background: 'transparent',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              minWidth: '150px'
            }}
          />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0 1rem',
            borderLeft: '1px solid var(--line)',
            borderRight: '1px solid var(--line)'
          }}>
            <button 
              className="btn btn-primary" 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.25rem 0.5rem',
                fontSize: '0.875rem'
              }}
              onMouseDown={(e) => { e.preventDefault(); doUpdateTitle(titleLocal) }}
            >
              <Save size={14} />
              Save
            </button>

            <button 
              className="btn btn-secondary" 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.25rem 0.5rem',
                fontSize: '0.875rem'
              }}
              onMouseDown={(e) => { e.preventDefault(); doExport() }}
            >
              <Download size={14} />
              Export
            </button>
          </div>

          {/* Undo and Redo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <button className="icon-btn" onMouseDown={(e) => { e.preventDefault(); undo() }} disabled={historyIndex <= 0}>
              <Undo size={16} />
            </button>
            <button className="icon-btn" onMouseDown={(e) => { e.preventDefault(); redo() }} disabled={historyIndex >= history.length - 1}>
              <Redo size={16} />
            </button>
          </div>

          {/* Font */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <select 
              value={selectedFont}
              onChange={(e) => {
                e.stopPropagation()
                applyFont(e.target.value)
              }}
              style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.875rem' }}
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Calibri">Calibri</option>
              <option value="Verdana">Verdana</option>
              <option value="Georgia">Georgia</option>
              <option value="Solitreo">Solitreo</option>
            </select>
          </div>

          {/* Font Size */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <input
              ref={inputRef}
              type="number"
              value={fontSizeValue}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                if (!Number.isNaN(val) && val > 0) {
                  setFontSizeValue(val)
                }
              }}
              onBlur={() => {
                applyFontSize(fontSizeValue)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  applyFontSize(fontSizeValue)
                  inputRef.current?.blur()
                }
              }}
              style={{ width: '55px', padding: '4px 4px 4px 8px', borderRadius: '4px', fontSize: '0.875rem' }}
            />
          </div>

          {/* Bold, Italics, Underline */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0 1rem',
            borderLeft: '1px solid var(--line)',
            borderRight: '1px solid var(--line)'
          }}>
            <button className="icon-btn" onMouseDown={(e) => { e.preventDefault(); applyFormat('bold') }} style={isBold ? { background: 'var(--bg)', color: 'var(--text)' } : undefined}>
              <Bold size={16} />
            </button>
            <button className="icon-btn" onMouseDown={(e) => { e.preventDefault(); applyFormat('italic') }} style={isItalic ? { background: 'var(--bg)', color: 'var(--text)' } : undefined}>
              <Italic size={16} />
            </button>
            <button className="icon-btn" onMouseDown={(e) => { e.preventDefault(); applyFormat('underline') }} style={isUnderline ? { background: 'var(--bg)', color: 'var(--text)' } : undefined}>
              <Underline size={16} />
            </button>
          </div>

          {/* Text Color and Highlight Color */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <button className="icon-btn" onMouseDown={(e) => { e.preventDefault(); applyTextColor('#000000') }}>
              <Palette size={16} />
            </button>
            <button className="icon-btn" onMouseDown={(e) => { e.preventDefault(); applyHighlightColor('#FFFF00') }}>
              <Highlighter size={16} />
            </button>
          </div>

          {/* Alignment */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <button className="icon-btn" onMouseDown={(e) => { e.preventDefault(); applyAlignment('left') }}>
              <AlignLeft size={16} />
            </button>
            <button className="icon-btn" onMouseDown={(e) => { e.preventDefault(); applyAlignment('center') }}>
              <AlignCenter size={16} />
            </button>
            <button className="icon-btn" onMouseDown={(e) => { e.preventDefault(); applyAlignment('right') }}>
              <AlignRight size={16} />
            </button>
          </div>

          {/* Line Spacing */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <button className="icon-btn" onMouseDown={(e) => { e.preventDefault(); applyLineSpacing() }}>
              <BetweenVerticalEnd size={16} />
            </button>
          </div>

          {/* Bullet Lists and Number Lists */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <button className="icon-btn" onMouseDown={(e) => { e.preventDefault(); applyList(false) }}>
              <List size={16} />
            </button>
            <button className="icon-btn" onMouseDown={(e) => { e.preventDefault(); applyList(true) }}>
              <ListOrdered size={16} />
            </button>
          </div>

          {/* Zoom Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0 1rem',
            borderLeft: '1px solid var(--line)'
          }}>
            <button 
              className="icon-btn"
              onMouseDown={(e) => { e.preventDefault(); setZoomLevel(Math.max(50, zoomLevel - 10)) }}
              disabled={zoomLevel <= 50}
            >
              <ZoomOut size={16} />
            </button>
            <span style={{
              fontSize: '0.875rem',
              color: 'var(--text)',
              minWidth: '3rem',
              textAlign: 'center'
            }}>
              {zoomLevel}%
            </span>
            <button 
              className="icon-btn"
              onMouseDown={(e) => { e.preventDefault(); setZoomLevel(Math.min(200, zoomLevel + 10)) }}
              disabled={zoomLevel >= 200}
            >
              <ZoomIn size={16} />
            </button>
          </div>
        </div>
      )

    }

    setToolbar(<TypeToolbar />)

    // Cleanup toolbar when component unmounts
    return () => setToolbar(null)
  }, [setToolbar])
  
  const handleBlocksChange = (pageId: number, blocks: DocumentBlock[]) => {
    setPageBlocks(pageId, blocks)
  }

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'var(--bg)'
    }}>
      {/* Document Pages */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        display: 'flex',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'top center',
          transition: 'transform 0.2s ease'
        }}>
          {doc.data.pages.map(page => (
            <DocumentPage
              key={page.id}
              page={page}
              onBlocksChange={handleBlocksChange}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
