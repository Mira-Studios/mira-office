import { Link } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { useServers } from '../contexts/ServerContext'

// ?inline imports
import miraTypeLogo  from '../assets/miraType.webp?inline'
import miraDeckLogo  from '../assets/miraDeck.webp?inline'
import miraMatrixLogo from '../assets/miraMatrix.webp?inline'
import miraOfficeLogo from '../assets/miraOffice.webp?inline'
import typeIcon      from '../assets/type-icon.webp?inline'
import deckIcon      from '../assets/deck-icon.webp?inline'
import matrixIcon     from '../assets/matrix-icon.webp?inline'

import {
  FileText,
  Presentation,
  Grid3x3,
  Home,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LucideIcon
} from 'lucide-react'

interface OfficeLayoutProps {
  children: React.ReactNode
  currentApp: 'type' | 'deck' | 'matrix' | 'settings' | null
  toolbar?: React.ReactNode
}

interface NavItem {
  to: string
  label: string
  key: string
  icon: LucideIcon
  logo?: string
}

const navItems: NavItem[] = [
  { to: '/home',   label: 'Home',        key: 'home',   icon: Home },
  { to: '/type',   label: 'miraType',   key: 'type',   icon: FileText,     logo: typeIcon },
  { to: '/deck',   label: 'miraDeck',   key: 'deck',   icon: Presentation, logo: deckIcon },
  { to: '/matrix', label: 'miraMatrix', key: 'matrix', icon: Grid3x3,      logo: matrixIcon },
]

const getAppLogo = (app: string | null) => {
  switch (app) {
    case 'type':   return miraTypeLogo
    case 'deck':   return miraDeckLogo
    case 'matrix': return miraMatrixLogo
    default:       return miraOfficeLogo
  }
}

const getAppLabel = (app: string | null) => {
  switch (app) {
    case 'type':   return 'miraType'
    case 'deck':   return 'miraDeck'
    case 'matrix': return 'miraMatrix'
    default:       return 'miraOffice'
  }
}

export function OfficeLayout({ children, currentApp, toolbar }: OfficeLayoutProps) {
  const { servers, selectedServerId, selectServer } = useServers()
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    return saved !== null ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
  }, [isCollapsed])

  // Check if we're on an edit page (/:id routes)
  const isEditPage = window.location.pathname.match(/\/(type|deck|matrix)\/[^\/]+$/)
  const shouldHideSidebar = isCollapsed && isEditPage

  // This helper ensures the icon and text are wrapped consistently
  const renderLinkContent = (item: NavItem | { label: string; icon: LucideIcon }, isActive: boolean) => {
    const Icon = item.icon
    const logoSrc = 'logo' in item ? item.logo : null

    return (
      <>
        {/* Icon Container: Fixed width ensures icon doesn't move when sidebar shrinks */}
        <div style={{ 
          width: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          flexShrink: 0,
          marginLeft: '-5px'
        }}>
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={item.label}
              style={{ width: '18px', height: '18px', opacity: isActive ? 1 : 0.7 }}
            />
          ) : (
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
          )}
        </div>

        {/* Text Label: Fades out but stays in the DOM to maintain layout during transition if needed, 
            or hidden via opacity/width for smoothness */}
        <span style={{ 
          marginLeft: '12px',
          whiteSpace: 'nowrap',
          opacity: isCollapsed ? 0 : 1,
          pointerEvents: isCollapsed ? 'none' : 'auto',
          transition: 'opacity 0.2s ease',
        }}>
          {item.label}
        </span>
      </>
    )
  }

  const getLinkStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start', // Always stay on the left
    padding: '10px 12px', // Horizontal padding stays consistent
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: isActive ? 600 : 500,
    background: isActive ? 'var(--bg)' : 'transparent',
    color: isActive ? 'var(--text)' : 'var(--muted)',
    marginBottom: '4px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    textDecoration: 'none',
    overflow: 'hidden',
  })

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        width: '100%',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--line)',
        padding: '6px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 10,
      }}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '8px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
        >
          {isCollapsed
            ? <PanelLeftOpen  size={18} color="white" />
            : <PanelLeftClose size={18} color="white" />}
        </button>

        <img
          src={getAppLogo(currentApp)}
          alt={getAppLabel(currentApp)}
          style={{ height: '32px', width: 'auto', marginTop: '2px', marginBottom: '-2px' }}
        />

        {toolbar && (
          <div style={{ 
            marginLeft: '1rem',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '1rem',
            borderLeft: '1px solid var(--line)',
            height: '32px'
          }}>
            {toolbar}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside style={{
        width: shouldHideSidebar ? '0px' : (isCollapsed ? '55px' : 'var(--sidebar-width)'),
        background: 'var(--surface)',
        borderRight: shouldHideSidebar ? 'none' : '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        paddingTop: '50px',
        overflowX: 'hidden', // Crucial: hides text as width shrinks
      }}>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '8px' }}>
          {navItems.map(item => (
            <Link
              key={item.key}
              to={item.to}
              style={getLinkStyle(currentApp === item.key || (item.key === 'home' && !currentApp))}
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              {renderLinkContent(item, currentApp === item.key || (item.key === 'home' && !currentApp))}
            </Link>
          ))}
        </nav>

        {/* Server Switcher */}
        {servers.length > 0 && !isCollapsed && (
          <div style={{ padding: '8px', borderTop: '1px solid var(--line)' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--muted)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
              paddingLeft: '4px'
            }}>
              Server
            </div>
            <select
              value={selectedServerId ?? ''}
              onChange={(e) => selectServer(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg)',
                color: 'var(--text)',
                border: '1px solid var(--line)',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '13px',
                outline: 'none'
              }}
            >
              {servers.map((server) => (
                <option key={server.id} value={server.id}>
                  {server.location}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Settings */}
        <div style={{ padding: '8px', borderTop: '1px solid var(--line)' }}>
          <Link
            to="/settings"
            style={getLinkStyle(currentApp === 'settings')}
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            {renderLinkContent({ label: 'Settings', icon: Settings }, currentApp === 'settings')}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg)',
        paddingTop: '50px',
      }}>
        {children}
      </main>
    </div>
  )
}
