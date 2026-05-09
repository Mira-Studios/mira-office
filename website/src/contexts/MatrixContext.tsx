import { createContext, ReactNode, useContext, useState } from 'react'
import { MatrixDocument, MiraMatrixFile } from '../types/matrix'

interface MatrixContextType {
  file: MiraMatrixFile
  updateTitle: (title: string) => void
  setMatrixData: (data: MatrixDocument) => void
  importMatrix: (file: MiraMatrixFile) => void
  exportMatrix: () => Promise<void>
}

const MatrixContext = createContext<MatrixContextType | undefined>(undefined)

const initialMatrixData: MatrixDocument = {
  next_id: 2,
  sheets: [
    {
      id: 1,
      name: 'Sheet 1',
      cells: {
        A1: { v: 'Name' },
        B1: { v: 'Score' },
        A2: { v: 'Alice' },
        B2: { v: 95 },
        B3: { v: 87 },
        B4: { f: '=SUM(B2:B3)', v: 182 }
      }
    },
    {
      id: 2,
      name: 'Sheet 2',
      cells: {}
    }
  ]
}

export function MatrixProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<MiraMatrixFile>({
    metadata: {
      type: 'mtrx',
      title: 'Untitled Spreadsheet',
      created: Math.floor(Date.now() / 1000),
      modified: Math.floor(Date.now() / 1000)
    },
    data: initialMatrixData
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

  const setMatrixData = (data: MatrixDocument) => {
    setFile((prev) => ({
      ...prev,
      data,
      metadata: {
        ...prev.metadata,
        modified: Math.floor(Date.now() / 1000)
      }
    }))
  }

  const importMatrix = (nextFile: MiraMatrixFile) => {
    setFile(nextFile)
  }

  const exportMatrix = async () => {
    const exportFile: MiraMatrixFile = {
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
    const safeTitle = (exportFile.metadata.title || 'Untitled_Spreadsheet')
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
      .replace(/\s+/g, '_')
    a.download = `${safeTitle || 'Untitled_Spreadsheet'}.mtrx`
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <MatrixContext.Provider value={{ file, updateTitle, setMatrixData, importMatrix, exportMatrix }}>
      {children}
    </MatrixContext.Provider>
  )
}

export function useMatrix() {
  const context = useContext(MatrixContext)
  if (!context) throw new Error('useMatrix must be used within a MatrixProvider')
  return context
}
