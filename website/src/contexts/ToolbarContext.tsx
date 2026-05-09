import React, { createContext, useContext, ReactNode } from 'react'

interface ToolbarContextType {
  toolbar: ReactNode | null
  setToolbar: (toolbar: ReactNode | null) => void
}

const ToolbarContext = createContext<ToolbarContextType | undefined>(undefined)

export function ToolbarProvider({ children }: { children: ReactNode }) {
  const [toolbar, setToolbar] = React.useState<ReactNode | null>(null)

  return (
    <ToolbarContext.Provider value={{ toolbar, setToolbar }}>
      {children}
    </ToolbarContext.Provider>
  )
}

export function useToolbar() {
  const context = useContext(ToolbarContext)
  if (context === undefined) {
    throw new Error('useToolbar must be used within a ToolbarProvider')
  }
  return context
}
