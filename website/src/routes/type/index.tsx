import { createFileRoute, Link } from '@tanstack/react-router'
import { useRef } from 'react'
import { FileText, Plus, Edit, Trash2, Calendar, UploadCloud } from 'lucide-react'
import { useDocument } from '../../contexts/DocumentContext'
import { MiraDocument } from '../../types/document'

export const Route = createFileRoute('/type/')({
  component: TypeIndexComponent,
})

// Mock data for documents
const mockDocuments = [
  { id: '1', title: 'Project Proposal', modified: '2024-01-15', type: 'document' },
  { id: '2', title: 'Meeting Notes', modified: '2024-01-14', type: 'document' },
  { id: '3', title: 'Budget Report', modified: '2024-01-13', type: 'document' },
  { id: '4', title: 'Team Guidelines', modified: '2024-01-12', type: 'document' },
]

function TypeIndexComponent() {
  console.log('TypeIndexComponent rendered - showing document list')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { importDocument: doImportDocument } = useDocument()
  const navigate = Route.useNavigate()

  const handleOpenFile = async (file: File | null) => {
    if (!file) return
    const finishImport = (payload: any) => {
      try {
        console.log('finishImport payload preview', {
          hasMetadata: !!payload?.metadata,
          hasData: !!payload?.data,
          pages: (payload?.data?.pages || payload?.pages || []).length
        })
      } catch (e) {
        // ignore
      }
      try {
        // If payload already matches expected MiraDocument shape
        if (payload && payload.metadata && payload.data) {
          // Detect legacy shape inside payload.data.pages (blocks with `t` / `type` keys)
          const pagesCandidate = payload.data.pages
          if (Array.isArray(pagesCandidate) && pagesCandidate.length > 0) {
            const sampleBlock = pagesCandidate[0].blocks && pagesCandidate[0].blocks[0]
            if (sampleBlock && (sampleBlock.t !== undefined || sampleBlock.type)) {
              // convert legacy data.pages -> app pages
              const pagesPayload = pagesCandidate as any[]

              const next_page_id = payload.data.next_page_id ?? payload.data.next_id ?? (Math.max(...pagesPayload.map(p => p.id || 0)) + 1)
              let maxBlockId = 0
              pagesPayload.forEach(p => (p.blocks || []).forEach((b: any) => { if (b && typeof b.id === 'number') maxBlockId = Math.max(maxBlockId, b.id) }))
              const next_block_id = payload.data.next_block_id ?? (maxBlockId + 1)

              const convertBlock = (b: any) => {
                if (!b) return { id: 0, fontSize: 14, content: [{ text: '', formatting: {} }], alignment: 'left' }

                if (b.type === 'img' || b.type === 'image') {
                  return {
                    id: b.id ?? 0,
                    fontSize: 14,
                    content: [{ text: '', formatting: {} }],
                    alignment: 'left',
                    src: b.src || b.file || undefined
                  }
                }

                let fontSize = 14
                if (b.type === 'h1') fontSize = 32
                else if (b.type === 'h2') fontSize = 24
                else if (b.type === 'h3') fontSize = 20
                else if (typeof b.fontSize === 'number') fontSize = b.fontSize

                let content: any[] = []
                if (typeof b.t === 'string') {
                  content = [{ text: b.t, formatting: {} }]
                } else if (Array.isArray(b.t)) {
                  content = b.t.map((seg: any) => {
                    const text = seg?.[0] ?? ''
                    const fmt = seg?.[1] ?? null
                    const formatting: any = {}
                    if (fmt) {
                      if (fmt.b || fmt.bold) formatting.bold = Boolean(fmt.b || fmt.bold)
                      if (fmt.i || fmt.italic) formatting.italic = Boolean(fmt.i || fmt.italic)
                      if (fmt.u || fmt.underline) formatting.underline = Boolean(fmt.u || fmt.underline)
                      if (fmt.fs || fmt.fontSize) formatting.fontSize = Number(fmt.fs ?? fmt.fontSize)
                    }
                    return { text, formatting }
                  })
                } else {
                  content = [{ text: String(b.t ?? ''), formatting: {} }]
                }

                return {
                  id: b.id ?? 0,
                  fontSize,
                  content,
                  alignment: b.alignment || 'left'
                }
              }

              const convertedPages = pagesPayload.map(p => ({
                id: p.id ?? 1,
                next_block_id: p.next_block_id ?? ((p.blocks || []).reduce((m: number, b: any) => Math.max(m, (b && b.id) || 0), 0) + 1),
                blocks: (p.blocks || []).map(convertBlock),
                pageSize: p.pageSize || 'Letter',
                margins: p.margins || { top: 96, right: 96, bottom: 96, left: 96 }
              }))

              const titleFromContent = (() => {
                try {
                  const firstPage = convertedPages[0]
                  if (!firstPage) return file.name.replace(/\.[^/.]+$/, '')
                  const firstBlock = firstPage.blocks?.find((bb: any) => bb && bb.content && bb.content.length > 0)
                  if (!firstBlock) return file.name.replace(/\.[^/.]+$/, '')
                  return (firstBlock.content[0]?.text || file.name.replace(/\.[^/.]+$/, ''))
                } catch (e) {
                  return file.name.replace(/\.[^/.]+$/, '')
                }
              })()

              const newDoc: MiraDocument = {
                metadata: {
                  mira_version: payload.metadata?.mira_version ?? '1.0',
                  type: 'mtyp',
                  title: payload.metadata?.title ?? titleFromContent,
                  created: payload.metadata?.created ?? Math.floor(Date.now() / 1000),
                  modified: payload.metadata?.modified ?? Math.floor(Date.now() / 1000),
                  author: payload.metadata?.author ?? 'import',
                  pageSize: convertedPages[0]?.pageSize || payload.metadata?.pageSize || 'Letter',
                  margins: convertedPages[0]?.margins || payload.metadata?.margins || { top: 96, right: 96, bottom: 96, left: 96 }
                },
                data: {
                  next_page_id,
                  next_block_id,
                  pages: convertedPages
                }
              }

              console.log('finishImport -> doImportDocument (converted)', {
                title: newDoc.metadata?.title,
                pages: newDoc.data?.pages?.length,
                firstBlock: (newDoc.data?.pages?.[0]?.blocks?.[0] || null)
              })
              doImportDocument(newDoc)
              return
            }
          }

          // If not legacy, assume payload is already the correct shape
          try {
            console.log('finishImport -> doImportDocument (assume correct shape)', {
              title: payload.metadata?.title,
              pages: payload.data?.pages?.length,
              firstBlock: (payload.data?.pages?.[0]?.blocks?.[0] || null)
            })
          } catch (e) {
            // ignore logging errors
          }
          doImportDocument(payload)
        } else if (payload && payload.pages) {
          // Legacy/simple export format: convert to MiraDocument
          const pagesPayload = payload.pages as any[]

          // compute document-level next ids
          const next_page_id = payload.next_id ?? payload.next_page_id ?? (Math.max(...pagesPayload.map(p => p.id || 0)) + 1)
          let maxBlockId = 0
          pagesPayload.forEach(p => (p.blocks || []).forEach((b: any) => { if (b && typeof b.id === 'number') maxBlockId = Math.max(maxBlockId, b.id) }))
          const next_block_id = payload.next_block_id ?? (maxBlockId + 1)

          const convertBlock = (b: any) => {
            if (!b) return { id: 0, fontSize: 14, content: [{ text: '', formatting: {} }], alignment: 'left' }

            // Image blocks
            if (b.type === 'img' || b.type === 'image') {
              return {
                id: b.id ?? 0,
                fontSize: 14,
                content: [{ text: '', formatting: {} }],
                alignment: 'left',
                src: b.src || b.file || undefined
              }
            }

            // Determine font size from type
            let fontSize = 14
            if (b.type === 'h1') fontSize = 32
            else if (b.type === 'h2') fontSize = 24
            else if (b.type === 'h3') fontSize = 20
            else if (typeof b.fontSize === 'number') fontSize = b.fontSize

            // normalize content: can be string or array of [text, fmt]
            let content: any[] = []
            if (typeof b.t === 'string') {
              content = [{ text: b.t, formatting: {} }]
            } else if (Array.isArray(b.t)) {
              content = b.t.map((seg: any) => {
                const text = seg?.[0] ?? ''
                const fmt = seg?.[1] ?? null
                const formatting: any = {}
                if (fmt) {
                  if (fmt.b || fmt.bold) formatting.bold = Boolean(fmt.b || fmt.bold)
                  if (fmt.i || fmt.italic) formatting.italic = Boolean(fmt.i || fmt.italic)
                  if (fmt.u || fmt.underline) formatting.underline = Boolean(fmt.u || fmt.underline)
                  if (fmt.fs || fmt.fontSize) formatting.fontSize = Number(fmt.fs ?? fmt.fontSize)
                }
                return { text, formatting }
              })
            } else {
              content = [{ text: String(b.t ?? ''), formatting: {} }]
            }

            return {
              id: b.id ?? 0,
              fontSize,
              content,
              alignment: b.alignment || 'left'
            }
          }

          const convertedPages = pagesPayload.map(p => ({
            id: p.id ?? 1,
            next_block_id: p.next_block_id ?? ((p.blocks || []).reduce((m: number, b: any) => Math.max(m, (b && b.id) || 0), 0) + 1),
            blocks: (p.blocks || []).map(convertBlock),
            pageSize: p.pageSize || 'Letter',
            margins: p.margins || { top: 96, right: 96, bottom: 96, left: 96 }
          }))

          const titleFromContent = (() => {
            try {
              const firstPage = convertedPages[0]
              if (!firstPage) return file.name.replace(/\.[^/.]+$/, '')
              const firstBlock = firstPage.blocks?.find((bb: any) => bb && bb.content && bb.content.length > 0)
              if (!firstBlock) return file.name.replace(/\.[^/.]+$/, '')
              return (firstBlock.content[0]?.text || file.name.replace(/\.[^/.]+$/, ''))
            } catch (e) {
              return file.name.replace(/\.[^/.]+$/, '')
            }
          })()

          const newDoc: MiraDocument = {
            metadata: {
              mira_version: '1.0',
              type: 'mtyp',
              title: titleFromContent,
              created: Math.floor(Date.now() / 1000),
              modified: Math.floor(Date.now() / 1000),
              author: 'import',
              pageSize: convertedPages[0]?.pageSize || 'Letter',
              margins: convertedPages[0]?.margins || { top: 96, right: 96, bottom: 96, left: 96 }
            },
            data: {
              next_page_id,
              next_block_id,
              pages: convertedPages
            }
          }

          doImportDocument(newDoc)
        } else {
          console.warn('Unrecognized document format during import', payload)
          window.alert('Failed to open file: unrecognized format')
          return
        }

        // navigate to editor so the imported document is visible
        try {
          // Delay navigation slightly so the DocumentProvider state update
          // has time to flush and the editor sees the imported document.
          setTimeout(() => {
            try {
              navigate({ to: '/type/$id', params: { id: '1' } })
            } catch (err) {
              window.location.href = '/type/1'
            }
          }, 50)
        } catch (e) {
          // fallback to full navigation
          window.location.href = '/type/1'
        }
      } catch (e) {
        console.error('Import failed', e)
      }
    }
    try {
      const buffer = await file.arrayBuffer()

      // Try to read as zip (expected .mtyp package)
      try {
        const JSZipMod = await import('jszip')
        const JSZip = JSZipMod.default
        const zip = await JSZip.loadAsync(buffer)

        const mdFile = zip.file('metadata.msgpack') ?? zip.file('metadata.json')
        const dataFile = zip.file('data.msgpack') ?? zip.file('data.json')

        if (mdFile && dataFile) {
          const mdArr = await mdFile.async('uint8array')
          const dataArr = await dataFile.async('uint8array')

          try {
            const { decode } = await import('@msgpack/msgpack')
            const metadata = decode(mdArr)
            const data = decode(dataArr)
            finishImport({ metadata, data })
            return
          } catch (e) {
            // fallback to JSON
            const mdText = new TextDecoder().decode(mdArr)
            const dataText = new TextDecoder().decode(dataArr)
            const metadata = JSON.parse(mdText)
            const data = JSON.parse(dataText)
            finishImport({ metadata, data })
            return
          }
        } else if (dataFile) {
          // Some legacy exports may only include data.json (no metadata.json)
          const dataArr = await dataFile.async('uint8array')
          try {
            const { decode } = await import('@msgpack/msgpack')
            const data = decode(dataArr)
            finishImport(data)
            return
          } catch (e) {
            try {
              const dataText = new TextDecoder().decode(dataArr)
              const parsed = JSON.parse(dataText)
              finishImport(parsed)
              return
            } catch (err) {
              // fall through
            }
          }
        }
        
        window.alert('Failed to open file: package is missing document data')
        return
      } catch (zipErr) {
        console.error('Failed to read .mtyp package', zipErr)
        window.alert('Failed to open file: expected a valid .mtyp package')
        return
      }

    } catch (err) {
      console.error('Error reading file', err)
      window.alert('Failed to open file')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }
  
  return (
      <div style={{ padding: '2rem', height: '100%', overflow: 'auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: '600', 
              margin: 0,
              color: 'var(--text)'
            }}>
              Documents
            </h1>
            <p style={{ 
              color: 'var(--muted)', 
              margin: '0.5rem 0 0 0' 
            }}>
              {mockDocuments.length} documents
            </p>
          </div>
          <Link
            to="/type/new"
            className="btn btn-primary"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Plus size={16} />
            New Document
          </Link>
          <button
            className="btn btn-ghost"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud size={14} />
            Open
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mtyp"
            style={{ display: 'none' }}
            onChange={(e) => handleOpenFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem'
        }}>
          {mockDocuments.map((doc) => (
            <Link 
              key={doc.id}
              to="/type/$id" 
              params={{ id: doc.id }}
              className="card"
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                position: 'relative',
                textDecoration: 'none',
                display: 'block'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem'
              }}>
                <div style={{
                  background: 'var(--bg-accent-a)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FileText size={24} color="var(--primary)" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    margin: '0 0 0.5rem 0', 
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: 'var(--text)'
                  }}>
                    {doc.title}
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--muted)',
                    fontSize: '0.875rem'
                  }}>
                    <Calendar size={14} />
                    {doc.modified}
                  </div>
                </div>
              </div>
              
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                display: 'flex',
                gap: '0.5rem',
                opacity: 0,
                transition: 'opacity 0.2s ease'
              }} className="card-actions">
                <button
                  className="icon-btn"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--line)'
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    // Handle edit
                  }}
                >
                  <Edit size={14} />
                </button>
                <button
                  className="icon-btn"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--line)'
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    // Handle delete
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
  )
}
