import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ServerProvider } from '../contexts/ServerContext'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <ServerProvider>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
    </ServerProvider>
  )
}
