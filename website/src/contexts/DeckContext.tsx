import { createContext, ReactNode, useContext, useState } from 'react'
import { DeckDocument, MiraDeckFile } from '../types/deck'

interface DeckContextType {
  file: MiraDeckFile
  updateTitle: (title: string) => void
  setDeckData: (data: DeckDocument) => void
  importDeck: (file: MiraDeckFile) => void
  exportDeck: () => Promise<void>
}

const DeckContext = createContext<DeckContextType | undefined>(undefined)

const initialDeckData: DeckDocument = {
  next_id: 2,
  slides: [
    {
      id: 1,
      bg: '#ffffff',
      next_block_id: 3,
      blocks: [
        { id: 1, type: 'h1', t: 'Slide Title', x: 100, y: 80 },
        { id: 2, type: 'p', t: 'Subtitle', x: 100, y: 160 }
      ]
    },
    {
      id: 2,
      bg: '#ffffff',
      next_block_id: 1,
      blocks: []
    }
  ]
}

export function DeckProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<MiraDeckFile>({
    metadata: {
      type: 'mdeck',
      title: 'Untitled Presentation',
      created: Math.floor(Date.now() / 1000),
      modified: Math.floor(Date.now() / 1000)
    },
    data: initialDeckData
  })

  const updateTitle = (title: string) => {
    setFile((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        title,
        modified: Math.floor(Date.now() / 1000)
      }
    }))
  }

  const setDeckData = (data: DeckDocument) => {
    setFile((prev) => ({
      ...prev,
      data,
      metadata: {
        ...prev.metadata,
        modified: Math.floor(Date.now() / 1000)
      }
    }))
  }

  const importDeck = (nextFile: MiraDeckFile) => {
    setFile(nextFile)
  }

  const exportDeck = async () => {
    const exportFile: MiraDeckFile = {
      ...file,
      metadata: {
        ...file.metadata,
        modified: Math.floor(Date.now() / 1000)
      }
    }

    const { encode } = await import('@msgpack/msgpack')
    const JSZip = await import('jszip')
    const zip = new JSZip.default()

    zip.file('metadata.msgpack', encode(exportFile.metadata))
    zip.file('data.msgpack', encode(exportFile.data))

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    const safeTitle = (exportFile.metadata.title || 'Untitled_Presentation')
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
      .replace(/\s+/g, '_')
    a.download = `${safeTitle || 'Untitled_Presentation'}.mdeck`
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <DeckContext.Provider value={{ file, updateTitle, setDeckData, importDeck, exportDeck }}>
      {children}
    </DeckContext.Provider>
  )
}

export function useDeck() {
  const context = useContext(DeckContext)
  if (!context) throw new Error('useDeck must be used within a DeckProvider')
  return context
}
