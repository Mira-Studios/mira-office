import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useRef } from 'react'
import { OfficeLayout } from '../components/OfficeLayout'
import { Presentation, Plus, Edit, Trash2, Calendar, UploadCloud } from 'lucide-react'
import { ToolbarProvider, useToolbar } from '../contexts/ToolbarContext'
import { DeckProvider, useDeck } from '../contexts/DeckContext'
import { DeckDocument, MiraDeckFile } from '../types/deck'

export const Route = createFileRoute('/deck')({
  component: DeckComponent,
})

const mockPresentations = [
  { id: '1', title: 'Q4 Business Review', modified: '2024-01-15', slides: 24 },
  { id: '2', title: 'Product Launch', modified: '2024-01-14', slides: 18 },
  { id: '3', title: 'Team Training', modified: '2024-01-13', slides: 32 },
  { id: '4', title: 'Client Proposal', modified: '2024-01-12', slides: 15 },
]

function DeckComponent() {
  return (
    <DeckProvider>
      <ToolbarProvider>
        <DeckLayout />
      </ToolbarProvider>
    </DeckProvider>
  )
}

function DeckLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const isIndex = pathname === '/deck' || pathname === '/deck/'
  const { toolbar } = useToolbar()

  return (
    <OfficeLayout currentApp="deck" toolbar={toolbar}>
      {isIndex ? <DeckIndex /> : <Outlet />}
    </OfficeLayout>
  )
}

function DeckIndex() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { importDeck } = useDeck()
  const navigate = Route.useNavigate()

  const handleOpenFile = async (file: File | null) => {
    if (!file) return
    try {
      const buffer = await file.arrayBuffer()

      const finishImport = (payload: any) => {
        let nextFile: MiraDeckFile | null = null

        if (payload?.metadata && payload?.data) {
          nextFile = {
            metadata: {
              type: 'mdeck',
              title: payload.metadata?.title ?? file.name.replace(/\.[^/.]+$/, ''),
              created: payload.metadata?.created ?? Math.floor(Date.now() / 1000),
              modified: payload.metadata?.modified ?? Math.floor(Date.now() / 1000)
            },
            data: payload.data as DeckDocument
          }
        } else if (payload?.slides) {
          nextFile = {
            metadata: {
              type: 'mdeck',
              title: file.name.replace(/\.[^/.]+$/, ''),
              created: Math.floor(Date.now() / 1000),
              modified: Math.floor(Date.now() / 1000)
            },
            data: payload as DeckDocument
          }
        }

        if (!nextFile) {
          window.alert('Failed to open file: unrecognized format')
          return
        }

        importDeck(nextFile)
        setTimeout(() => {
          navigate({ to: '/deck/$id', params: { id: '1' } })
        }, 50)
      }

      try {
        const JSZipMod = await import('jszip')
        const zip = await JSZipMod.default.loadAsync(buffer)
        const mdFile = zip.file('metadata.msgpack') ?? zip.file('metadata.json')
        const dataFile = zip.file('data.msgpack') ?? zip.file('data.json')

        if (mdFile && dataFile) {
          const mdArr = await mdFile.async('uint8array')
          const dataArr = await dataFile.async('uint8array')
          try {
            const { decode } = await import('@msgpack/msgpack')
            finishImport({ metadata: decode(mdArr), data: decode(dataArr) })
            return
          } catch {
            finishImport({
              metadata: JSON.parse(new TextDecoder().decode(mdArr)),
              data: JSON.parse(new TextDecoder().decode(dataArr))
            })
            return
          }
        }
      } catch {
        window.alert('Failed to open file: expected a valid .mdeck package')
      }
    } catch (err) {
      console.error('Error opening deck file', err)
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
            Presentations
          </h1>
          <p style={{
            color: 'var(--muted)',
            margin: '0.5rem 0 0 0'
          }}>
            {mockPresentations.length} presentations
          </p>
        </div>
        <Link
          to="/deck/new"
          className="btn btn-primary"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Plus size={16} />
          New Presentation
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
          accept=".mdeck"
          style={{ display: 'none' }}
          onChange={(e) => handleOpenFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem'
      }}>
        {mockPresentations.map((presentation) => (
          <Link
            key={presentation.id}
            to="/deck/$id"
            params={{ id: presentation.id }}
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
                <Presentation size={24} color="var(--primary)" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: 'var(--text)'
                }}>
                  {presentation.title}
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--muted)',
                  fontSize: '0.875rem',
                  marginBottom: '0.25rem'
                }}>
                  <Calendar size={14} />
                  {presentation.modified}
                </div>
                <div style={{
                  color: 'var(--muted)',
                  fontSize: '0.875rem'
                }}>
                  {presentation.slides} slides
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
                  e.preventDefault()
                  e.stopPropagation()
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
                  e.preventDefault()
                  e.stopPropagation()
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
