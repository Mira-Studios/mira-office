import { createFileRoute, Outlet } from '@tanstack/react-router'
import { OfficeLayout } from '../components/OfficeLayout'
import { ToolbarProvider, useToolbar } from '../contexts/ToolbarContext'
import { DocumentProvider } from '../contexts/DocumentContext'

export const Route = createFileRoute('/type')({
  component: TypeLayoutComponent,
})

function TypeLayoutComponent() {
  console.log('TypeLayoutComponent rendered - providing layout for type routes')
  
  return (
    <DocumentProvider>
      <ToolbarProvider>
        <TypeLayoutWithToolbar />
      </ToolbarProvider>
    </DocumentProvider>
  )
}

function TypeLayoutWithToolbar() {
  const { toolbar } = useToolbar()
  
  return (
    <OfficeLayout currentApp="type" toolbar={toolbar}>
      <Outlet />
    </OfficeLayout>
  )
}
