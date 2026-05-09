export interface TextSpan {
  text: string
  formatting: {
    bold?: boolean
    italic?: boolean
    underline?: boolean
    color?: string
    backgroundColor?: string
    fontSize?: number
  }
}

export interface DocumentBlock {
  id: number
  fontSize: number
  content: TextSpan[]
  alignment: 'left' | 'center' | 'right' | 'justify'
  src?: string
  listItems?: string[]
}

export interface DocumentPage {
  id: number
  next_block_id: number
  blocks: DocumentBlock[]
  pageSize: 'A4' | 'Letter'
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export interface DocumentData {
  next_page_id: number
  next_block_id: number
  pages: DocumentPage[]
}

export interface DocumentMetadata {
  mira_version: string
  type: 'mtyp'
  title: string
  created: number
  modified: number
  author: string
  pageSize: 'A4' | 'Letter'
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export interface MiraDocument {
  metadata: DocumentMetadata
  data: DocumentData
}
