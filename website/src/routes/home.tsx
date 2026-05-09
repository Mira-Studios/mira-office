import { createFileRoute, Link } from '@tanstack/react-router'
import { OfficeLayout } from '../components/OfficeLayout'
import typeIcon from '../assets/type-icon.webp'
import deckIcon from '../assets/deck-icon.webp'
import matrixIcon from '../assets/matrix-icon.webp'
import { FileText, Presentation, Grid3x3, Plus } from 'lucide-react'

export const Route = createFileRoute('/home')({
  component: HomeComponent,
})

// Mock data for all documents
const mockDocuments = [
  { id: '1', title: 'Project Proposal', modified: '2024-01-15', type: 'type', app: 'Mira Type' },
  { id: '2', title: 'Q4 Business Review', modified: '2024-01-14', type: 'deck', app: 'Mira Deck' },
  { id: '3', title: 'Budget 2024', modified: '2024-01-13', type: 'matrix', app: 'Mira Matrix' },
  { id: '4', title: 'Meeting Notes', modified: '2024-01-12', type: 'type', app: 'Mira Type' },
  { id: '5', title: 'Product Launch', modified: '2024-01-11', type: 'deck', app: 'Mira Deck' },
  { id: '6', title: 'Sales Data', modified: '2024-01-10', type: 'matrix', app: 'Mira Matrix' },
]

const getAppIcon = (type: string) => {
  switch (type) {
    case 'type': return typeIcon
    case 'deck': return deckIcon
    case 'matrix': return matrixIcon
    default: return null
  }
}

const getAppIconComponent = (type: string) => {
  switch (type) {
    case 'type': return FileText
    case 'deck': return Presentation
    case 'matrix': return Grid3x3
    default: return FileText
  }
}

function HomeComponent() {
  return (
    <OfficeLayout currentApp={null}>
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
              All Documents
            </h1>
            <p style={{ 
              color: 'var(--muted)', 
              margin: '0.5rem 0 0 0' 
            }}>
              {mockDocuments.length} documents across all apps
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link
              to="/type/new"
              className="btn btn-ghost"
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <FileText size={16} />
              New Document
            </Link>
            <Link
              to="/deck/new"
              className="btn btn-ghost"
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Presentation size={16} />
              New Presentation
            </Link>
            <Link
              to="/matrix/new"
              className="btn btn-ghost"
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Grid3x3 size={16} />
              New Spreadsheet
            </Link>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1rem'
        }}>
          {mockDocuments.map((doc) => {
            const IconComponent = getAppIconComponent(doc.type)
            const appLogo = getAppIcon(doc.type)
            
            return (
              <Link
                key={doc.id}
                to={`/${doc.type}/${doc.id}`}
                className="card"
                style={{
                  textDecoration: 'none',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div style={{
                  background: 'var(--bg-accent-a)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {appLogo ? (
                    <img 
                      src={appLogo} 
                      alt={doc.app} 
                      style={{ 
                        width: '24px', 
                        height: '24px'
                      }} 
                    />
                  ) : (
                    <IconComponent size={24} color="var(--primary)" />
                  )}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ 
                    margin: '0 0 0.5rem 0', 
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: 'var(--text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {doc.title}
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: 'var(--muted)',
                    fontSize: '0.875rem'
                  }}>
                    <span>{doc.app}</span>
                    <span>{doc.modified}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </OfficeLayout>
  )
}
