import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import miraTypeLogo from '../assets/miraType.webp'
import miraDeckLogo from '../assets/miraDeck.webp'
import miraMatrixLogo from '../assets/miraMatrix.webp'
import { useServers } from '../contexts/ServerContext'

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

function IndexComponent() {
  const { servers, selectedServer, addServer } = useServers()
  const [location, setLocation] = useState('')
  const [key, setKey] = useState('')

  const handleAddServer = () => {
    const trimmedLocation = location.trim()
    const trimmedKey = key.trim()
    if (!trimmedLocation || !trimmedKey) return

    addServer({
      location: trimmedLocation,
      key: trimmedKey
    })

    setLocation('')
    setKey('')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: '700',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, var(--primary), var(--primary-soft))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Mira Office
        </h1>
        <p style={{
          fontSize: '1.25rem',
          color: 'var(--muted)',
          marginBottom: '3rem'
        }}>
          Your complete productivity suite
        </p>
        
        <div style={{
          margin: '0 auto 2.5rem',
          maxWidth: '760px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
          border: '1px solid var(--line)',
          borderRadius: '20px',
          padding: '1.5rem',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 280px' }}>
              <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)', fontSize: '1.35rem' }}>
                Add Server
              </h2>
              <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.5 }}>
                Save a server location and key now so switching between servers is ready when the backend arrives.
              </p>
            </div>
            {selectedServer && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '14px',
                background: 'var(--bg-accent-a)',
                border: '1px solid var(--line)',
                minWidth: '220px'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Active Server
                </div>
                <div style={{ color: 'var(--text)', fontWeight: 600, wordBreak: 'break-word' }}>
                  {selectedServer.location}
                </div>
              </div>
            )}
          </div>

          <div style={{
            marginTop: '1.25rem',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr) auto',
            gap: '0.75rem',
            alignItems: 'end'
          }}>
            <label style={{ display: 'block' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>Location</div>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="https://server.example.com or 10.0.0.5:9000"
                style={{
                  width: '100%',
                  padding: '0.8rem 0.9rem',
                  borderRadius: '12px',
                  border: '1px solid var(--line)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  outline: 'none'
                }}
              />
            </label>

            <label style={{ display: 'block' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>Key</div>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Server key"
                style={{
                  width: '100%',
                  padding: '0.8rem 0.9rem',
                  borderRadius: '12px',
                  border: '1px solid var(--line)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  outline: 'none'
                }}
              />
            </label>

            <button
              className="btn btn-primary"
              onClick={handleAddServer}
              disabled={!location.trim() || !key.trim()}
              style={{ padding: '0.85rem 1.1rem', height: 'fit-content' }}
            >
              Add Server
            </button>
          </div>

          {servers.length > 0 && (
            <div style={{
              marginTop: '1rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.75rem'
            }}>
              {servers.map((server) => (
                <div
                  key={server.id}
                  style={{
                    textAlign: 'left',
                    padding: '0.9rem 1rem',
                    borderRadius: '14px',
                    border: selectedServer?.id === server.id ? '1px solid var(--primary)' : '1px solid var(--line)',
                    background: selectedServer?.id === server.id ? 'var(--bg-accent-a)' : 'var(--surface)'
                  }}
                >
                  <div style={{ color: 'var(--text)', fontWeight: 600, marginBottom: '0.25rem', wordBreak: 'break-word' }}>
                    {server.location}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                    Key saved
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginTop: '2rem'
        }}>
          <Link
            to="/type"
            className="card"
            style={{
              textDecoration: 'none',
              padding: '2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <img 
              src={miraTypeLogo} 
              alt="Mira Type" 
              style={{ 
                height: '80px', 
                width: 'auto',
                marginBottom: '1rem'
              }} 
            />
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600',
              color: 'var(--text)',
              margin: 0
            }}>
              Mira Type
            </h3>
            <p style={{ 
              color: 'var(--muted)',
              margin: 0,
              lineHeight: 1.5
            }}>
              Professional document editing with powerful formatting tools
            </p>
          </Link>

          <Link
            to="/deck"
            className="card"
            style={{
              textDecoration: 'none',
              padding: '2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <img 
              src={miraDeckLogo} 
              alt="Mira Deck" 
              style={{ 
                height: '80px', 
                width: 'auto',
                marginBottom: '1rem'
              }} 
            />
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600',
              color: 'var(--text)',
              margin: 0
            }}>
              Mira Deck
            </h3>
            <p style={{ 
              color: 'var(--muted)',
              margin: 0,
              lineHeight: 1.5
            }}>
              Create stunning presentations with ease
            </p>
          </Link>

          <Link
            to="/matrix"
            className="card"
            style={{
              textDecoration: 'none',
              padding: '2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <img 
              src={miraMatrixLogo} 
              alt="Mira Matrix" 
              style={{ 
                height: '80px', 
                width: 'auto',
                marginBottom: '1rem'
              }} 
            />
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600',
              color: 'var(--text)',
              margin: 0
            }}>
              Mira Matrix
            </h3>
            <p style={{ 
              color: 'var(--muted)',
              margin: 0,
              lineHeight: 1.5
            }}>
              Powerful spreadsheets for data analysis
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
