import { createFileRoute } from '@tanstack/react-router'
import { Save, Download, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, ZoomIn, ZoomOut } from 'lucide-react'
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
      const [fontSizeRaw, setFontSizeRaw] = useState<string>(String(14))
      const [isBold, setIsBold] = useState(false)
      const [isItalic, setIsItalic] = useState(false)
      const [isUnderline, setIsUnderline] = useState(false)
      const inputRef = useRef<HTMLInputElement | null>(null)

      useEffect(() => {
        setTitleLocal(doc.metadata.title)
      }, [doc.metadata.title])

      const triggerEditorInput = () => {
        const el = window.document.querySelector('[data-rich-editor]') as HTMLElement | null
        if (el) el.dispatchEvent(new InputEvent('input', { bubbles: true }))
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
              setFontSizeRaw(String(found))
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
        window.document.execCommand(cmd, false)
        triggerEditorInput()
        updateActiveState()
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
              onClick={() => doUpdateTitle(titleLocal)}
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
              onClick={doExport}
            >
              <Download size={14} />
              Export
            </button>

            
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0 1rem',
            borderLeft: '1px solid var(--line)',
            borderRight: '1px solid var(--line)'
          }}>
            <button className="icon-btn" onClick={() => applyFormat('bold')} style={isBold ? { background: 'var(--bg)', color: 'var(--text)' } : undefined}>
              <Bold size={16} />
            </button>
            <button className="icon-btn" onClick={() => applyFormat('italic')} style={isItalic ? { background: 'var(--bg)', color: 'var(--text)' } : undefined}>
              <Italic size={16} />
            </button>
            <button className="icon-btn" onClick={() => applyFormat('underline')} style={isUnderline ? { background: 'var(--bg)', color: 'var(--text)' } : undefined}>
              <Underline size={16} />
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <button className="icon-btn">
              <AlignLeft size={16} />
            </button>
            <button className="icon-btn">
              <AlignCenter size={16} />
            </button>
            <button className="icon-btn">
              <AlignRight size={16} />
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0 1rem',
            borderLeft: '1px solid var(--line)'
          }}>
            <input
              list="font-sizes"
              ref={inputRef}
              type="text"
              value={fontSizeRaw}
              onChange={(e) => {
                // preserve raw user input; don't mutate the datalist
                setFontSizeRaw(e.target.value)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const parsed = parseFloat(fontSizeRaw)
                  if (!Number.isNaN(parsed)) {
                    applyFontSize(parsed)
                    setFontSizeRaw(String(parsed))
                  }
                  e.preventDefault()
                }
              }}
              onBlur={() => {
                const parsed = parseFloat(fontSizeRaw)
                if (!Number.isNaN(parsed)) {
                  applyFontSize(parsed)
                  setFontSizeRaw(String(parsed))
                }
              }}
              style={{ width: '84px', padding: '6px 8px', borderRadius: '6px', fontSize: '0.875rem' }}
            />
            <datalist id="font-sizes">
              <option value="10" />
              <option value="12" />
              <option value="14" />
              <option value="16" />
              <option value="18" />
              <option value="24" />
              <option value="32" />
              <option value="48" />
            </datalist>

            <button 
              className="icon-btn"
              onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
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
              onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
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
