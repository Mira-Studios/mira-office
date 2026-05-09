import { createFileRoute } from '@tanstack/react-router'
import { OfficeLayout } from '../components/OfficeLayout'
import { User, Palette, Bell, Shield } from 'lucide-react'

export const Route = createFileRoute('/settings')({
  component: SettingsComponent,
})

function SettingsComponent() {
  return (
    <OfficeLayout currentApp="settings">
      <div style={{ padding: '2rem', height: '100%', overflow: 'auto' }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '600', 
            margin: '0 0 2rem 0',
            color: 'var(--text)'
          }}>
            Settings
          </h1>

          <div style={{
            display: 'grid',
            gap: '1.5rem'
          }}>
            {/* Profile Section */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                margin: '0 0 1rem 0',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <User size={20} />
                Profile
              </h2>
              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--muted)',
                    marginBottom: '0.5rem'
                  }}>
                    Name
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Your name"
                    defaultValue="John Doe"
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--muted)',
                    marginBottom: '0.5rem'
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    className="input"
                    placeholder="your@email.com"
                    defaultValue="john@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Appearance Section */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                margin: '0 0 1rem 0',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Palette size={20} />
                Appearance
              </h2>
              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--muted)',
                    marginBottom: '0.5rem'
                  }}>
                    Theme
                  </label>
                  <select className="input" style={{
                    borderRadius: '8px',
                    padding: '0.65rem 1rem'
                  }}>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notifications Section */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                margin: '0 0 1rem 0',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Bell size={20} />
                Notifications
              </h2>
              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}>
                  <input type="checkbox" defaultChecked />
                  <span style={{ color: 'var(--text)' }}>
                    Email notifications
                  </span>
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}>
                  <input type="checkbox" defaultChecked />
                  <span style={{ color: 'var(--text)' }}>
                    Desktop notifications
                  </span>
                </label>
              </div>
            </div>

            {/* Security Section */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                margin: '0 0 1rem 0',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Shield size={20} />
                Security
              </h2>
              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                <button className="btn btn-ghost" style={{
                  justifyContent: 'flex-start',
                  width: '100%'
                }}>
                  Change Password
                </button>
                <button className="btn btn-ghost" style={{
                  justifyContent: 'flex-start',
                  width: '100%'
                }}>
                  Two-Factor Authentication
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OfficeLayout>
  )
}
