import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

export interface MiraServer {
  id: string
  location: string
  key: string
}

interface ServerContextType {
  servers: MiraServer[]
  selectedServerId: string | null
  selectedServer: MiraServer | null
  addServer: (server: Omit<MiraServer, 'id'>) => void
  selectServer: (id: string) => void
}

const ServerContext = createContext<ServerContextType | undefined>(undefined)

const SERVERS_KEY = 'mira-office-servers'
const SELECTED_SERVER_KEY = 'mira-office-selected-server'

export function ServerProvider({ children }: { children: ReactNode }) {
  const [servers, setServers] = useState<MiraServer[]>(() => {
    try {
      const savedServers = localStorage.getItem(SERVERS_KEY)
      if (savedServers) {
        return JSON.parse(savedServers) as MiraServer[]
      }
    } catch {
      // ignore storage parse errors
    }
    return []
  })

  const [selectedServerId, setSelectedServerId] = useState<string | null>(() => {
    try {
      const savedSelectedServer = localStorage.getItem(SELECTED_SERVER_KEY)
      if (savedSelectedServer) return savedSelectedServer

      const savedServers = localStorage.getItem(SERVERS_KEY)
      if (savedServers) {
        const parsed = JSON.parse(savedServers) as MiraServer[]
        return parsed[0]?.id ?? null
      }
    } catch {
      // ignore storage parse errors
    }
    return null
  })

  useEffect(() => {
    localStorage.setItem(SERVERS_KEY, JSON.stringify(servers))
  }, [servers])

  useEffect(() => {
    if (selectedServerId) {
      localStorage.setItem(SELECTED_SERVER_KEY, selectedServerId)
    } else {
      localStorage.removeItem(SELECTED_SERVER_KEY)
    }
  }, [selectedServerId])

  const addServer = (server: Omit<MiraServer, 'id'>) => {
    const nextServer: MiraServer = {
      id: Math.random().toString(36).slice(2),
      location: server.location,
      key: server.key
    }

    setServers((prev) => [...prev, nextServer])
    setSelectedServerId(nextServer.id)
  }

  const selectServer = (id: string) => {
    setSelectedServerId(id)
  }

  const selectedServer = servers.find((server) => server.id === selectedServerId) ?? null

  return (
    <ServerContext.Provider value={{ servers, selectedServerId, selectedServer, addServer, selectServer }}>
      {children}
    </ServerContext.Provider>
  )
}

export function useServers() {
  const context = useContext(ServerContext)
  if (!context) throw new Error('useServers must be used within a ServerProvider')
  return context
}
