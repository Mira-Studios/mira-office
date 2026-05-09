import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useRef } from 'react'
import { OfficeLayout } from '../components/OfficeLayout'
import { Grid3x3, Plus, Edit, Trash2, Calendar, UploadCloud } from 'lucide-react'
import { ToolbarProvider, useToolbar } from '../contexts/ToolbarContext'
import { MatrixProvider, useMatrix } from '../contexts/MatrixContext'
import { MatrixDocument, MiraMatrixFile } from '../types/matrix'

export const Route = createFileRoute('/matrix')({
  component: MatrixComponent,
})

const mockSpreadsheets = [
  { id: '1', title: 'Budget 2024', modified: '2024-01-15', cells: '1,234' },
  { id: '2', title: 'Sales Data', modified: '2024-01-14', cells: '5,678' },
  { id: '3', title: 'Inventory Tracker', modified: '2024-01-13', cells: '892' },
  { id: '4', title: 'Project Timeline', modified: '2024-01-12', cells: '456' },
]

function MatrixComponent() {
  return (
    <MatrixProvider>
      <ToolbarProvider>
        <MatrixLayout />
      </ToolbarProvider>
    </MatrixProvider>
  )
}

function MatrixLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const isIndex = pathname === '/matrix' || pathname === '/matrix/'
  const { toolbar } = useToolbar()

  return (
    <OfficeLayout currentApp="matrix" toolbar={toolbar}>
      {isIndex ? <MatrixIndex /> : <Outlet />}
    </OfficeLayout>
  )
}

function MatrixIndex() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { importMatrix } = useMatrix()
  const navigate = Route.useNavigate()

  const handleOpenFile = async (file: File | null) => {
    if (!file) return
    try {
      const buffer = await file.arrayBuffer()

      const finishImport = (payload: any) => {
        let nextFile: MiraMatrixFile | null = null

        if (payload?.metadata && payload?.data) {
          nextFile = {
            metadata: {
              type: 'mtrx',
              title: payload.metadata?.title ?? file.name.replace(/\.[^/.]+$/, ''),
              created: payload.metadata?.created ?? Math.floor(Date.now() / 1000),
              modified: payload.metadata?.modified ?? Math.floor(Date.now() / 1000)
            },
            data: payload.data as MatrixDocument
          }
        } else if (payload?.sheets) {
          nextFile = {
            metadata: {
              type: 'mtrx',
              title: file.name.replace(/\.[^/.]+$/, ''),
              created: Math.floor(Date.now() / 1000),
              modified: Math.floor(Date.now() / 1000)
            },
            data: payload as MatrixDocument
          }
        }

        if (!nextFile) {
          window.alert('Failed to open file: unrecognized format')
          return
        }

        importMatrix(nextFile)
        setTimeout(() => {
          navigate({ to: '/matrix/$id', params: { id: '1' } })
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
        window.alert('Failed to open file: expected a valid .mtrx package')
      }
    } catch (err) {
      console.error('Error opening matrix file', err)
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
            Spreadsheets
          </h1>
          <p style={{
            color: 'var(--muted)',
            margin: '0.5rem 0 0 0'
          }}>
            {mockSpreadsheets.length} spreadsheets
          </p>
        </div>
        <Link
          to="/matrix/new"
          className="btn btn-primary"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Plus size={16} />
          New Spreadsheet
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
          accept=".mtrx"
          style={{ display: 'none' }}
          onChange={(e) => handleOpenFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem'
      }}>
        {mockSpreadsheets.map((spreadsheet) => (
          <Link
            key={spreadsheet.id}
            to="/matrix/$id"
            params={{ id: spreadsheet.id }}
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
                <Grid3x3 size={24} color="var(--primary)" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: 'var(--text)'
                }}>
                  {spreadsheet.title}
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
                  {spreadsheet.modified}
                </div>
                <div style={{
                  color: 'var(--muted)',
                  fontSize: '0.875rem'
                }}>
                  {spreadsheet.cells} cells
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
