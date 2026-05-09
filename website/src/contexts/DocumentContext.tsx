import { createContext, useContext, ReactNode, useState } from 'react'
import { DocumentBlock, MiraDocument } from '../types/document'

interface DocumentContextType {
  document: MiraDocument
  updateTitle: (title: string) => void
  addBlock: (pageId: number, block: Omit<DocumentBlock, 'id'>) => void
  updateBlock: (pageId: number, blockId: number, updates: Partial<DocumentBlock>) => void
  setPageBlocks: (pageId: number, blocks: DocumentBlock[]) => void
  deleteBlock: (pageId: number, blockId: number) => void
  exportDocument: () => void
  importDocument: (doc: MiraDocument) => void
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined)

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [document, setDocument] = useState<MiraDocument>(() => ({
    metadata: {
      mira_version: '1.0',
      type: 'mtyp',
      title: 'Untitled',
      created: Math.floor(Date.now() / 1000),
      modified: Math.floor(Date.now() / 1000),
      author: 'username',
      pageSize: 'Letter',
      margins: {
        top: 96, // 1 inch in points
        right: 96,
        bottom: 96,
        left: 96
      }
    },
    data: {
      next_page_id: 2,
      next_block_id: 1,
      pages: [
        {
          id: 1,
          next_block_id: 1,
          blocks: [],
          pageSize: 'Letter',
          margins: {
            top: 96,
            right: 96,
            bottom: 96,
            left: 96
          }
        }
      ]
    }
  }))

  const updateTitle = (title: string) => {
    setDocument(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        title,
        modified: Math.floor(Date.now() / 1000)
      }
    }))
  }

  const addBlock = (pageId: number, block: Omit<DocumentBlock, 'id'>) => {
    setDocument(prev => {
      const updatedPages = prev.data.pages.map(page => {
        if (page.id === pageId) {
          const newBlock: DocumentBlock = {
            ...block,
            id: page.next_block_id,
            content: block.content || [{ text: '', formatting: {} }],
            alignment: block.alignment || 'left'
          }
          return {
            ...page,
            blocks: [...page.blocks, newBlock],
            next_block_id: page.next_block_id + 1
          }
        }
        return page
      })

      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          modified: Math.floor(Date.now() / 1000)
        },
        data: {
          ...prev.data,
          pages: updatedPages
        }
      }
    })
  }

  const updateBlock = (pageId: number, blockId: number, updates: Partial<DocumentBlock>) => {
    setDocument(prev => {
      const updatedPages = prev.data.pages.map(page => {
        if (page.id === pageId) {
          // Try to update existing block
          const existingIndex = page.blocks.findIndex(b => b.id === blockId)
          if (existingIndex !== -1) {
            return {
              ...page,
              blocks: page.blocks.map(block => 
                block.id === blockId ? { ...block, ...updates } : block
              )
            }
          }

          // If block doesn't exist, create it using page.next_block_id (or provided blockId)
          const newId = page.next_block_id ?? blockId
          const newBlock: DocumentBlock = {
            id: newId,
            fontSize: (updates.fontSize as number) ?? 14,
            content: (updates.content as any) ?? [{ text: '', formatting: {} }],
            alignment: (updates.alignment as any) ?? 'left',
            src: (updates as any).src,
            listItems: (updates as any).listItems
          }

          return {
            ...page,
            blocks: [...page.blocks, newBlock],
            next_block_id: (page.next_block_id ?? newId) + 1
          }
        }
        return page
      })

      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          modified: Math.floor(Date.now() / 1000)
        },
        data: {
          ...prev.data,
          pages: updatedPages
        }
      }
    })
  }

  const setPageBlocks = (pageId: number, blocks: DocumentBlock[]) => {
    setDocument(prev => {
      const updatedPages = prev.data.pages.map(page => {
        if (page.id !== pageId) return page

        const normalizedBlocks = blocks.length > 0
          ? blocks
          : [{
              id: 1,
              fontSize: 14,
              content: [{ text: '', formatting: {} }],
              alignment: 'left' as const
            }]

        const maxBlockId = normalizedBlocks.reduce((max, block) => Math.max(max, block.id), 0)

        return {
          ...page,
          blocks: normalizedBlocks,
          next_block_id: maxBlockId + 1
        }
      })

      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          modified: Math.floor(Date.now() / 1000)
        },
        data: {
          ...prev.data,
          pages: updatedPages
        }
      }
    })
  }

  const deleteBlock = (pageId: number, blockId: number) => {
    setDocument(prev => {
      const updatedPages = prev.data.pages.map(page => {
        if (page.id === pageId) {
          return {
            ...page,
            blocks: page.blocks.filter(block => block.id !== blockId)
          }
        }
        return page
      })

      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          modified: Math.floor(Date.now() / 1000)
        },
        data: {
          ...prev.data,
          pages: updatedPages
        }
      }
    })
  }

  const exportDocument = async () => {
    try {
      const exportDocument = {
        ...document,
        metadata: {
          ...document.metadata,
          modified: Math.floor(Date.now() / 1000)
        },
        data: {
          ...document.data
        }
      }

      try {
        console.log('exportDocument: exporting', { title: exportDocument.metadata.title, pages: exportDocument.data.pages.length, blocksPerPage: exportDocument.data.pages.map(p => p.blocks.length) })
      } catch (e) {
        // ignore
      }
      
      const { encode } = await import('@msgpack/msgpack')
      const JSZip = await import('jszip')
      
      const zip = new JSZip.default()
      
      // .mtyp is a zip package containing MessagePack payloads.
      const metadataBytes = encode(exportDocument.metadata)
      zip.file('metadata.msgpack', metadataBytes)
      
      const dataBytes = encode(exportDocument.data)
      zip.file('data.msgpack', dataBytes)
      
      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      
      // Download the file
      const url = URL.createObjectURL(zipBlob)
      const a = window.document.createElement('a')
      a.href = url
      const safeTitle = (exportDocument.metadata.title || 'Untitled')
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        .replace(/\s+/g, '_')
      a.download = `${safeTitle || 'Untitled'}.mtyp`
      window.document.body.appendChild(a)
      a.click()
      window.document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting document:', error)
    }
  }

  const importDocument = (newDoc: MiraDocument) => {
    if (!newDoc) return
    try {
      console.log('importDocument called', {
        title: newDoc.metadata?.title,
        pages: (newDoc.data?.pages || []).length,
        blocksPerPage: (newDoc.data?.pages || []).map(p => (p.blocks || []).length)
      })
    } catch (err) {
      // ignore logging errors
    }
    setDocument(() => ({
      metadata: newDoc.metadata,
      data: newDoc.data
    }))
  }

  return (
    <DocumentContext.Provider value={{
      document,
      updateTitle,
      addBlock,
      updateBlock,
      setPageBlocks,
      deleteBlock,
      exportDocument,
      importDocument
    }}>
      {children}
    </DocumentContext.Provider>
  )
}

export function useDocument() {
  const context = useContext(DocumentContext)
  if (context === undefined) {
    throw new Error('useDocument must be used within a DocumentProvider')
  }
  return context
}
