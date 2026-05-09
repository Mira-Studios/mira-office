export type DeckBlockType = 'h1' | 'p'

export interface DeckBlock {
  id: number
  type: DeckBlockType
  t: string
  x: number
  y: number
}

export interface DeckSlide {
  id: number
  bg: string
  next_block_id: number
  blocks: DeckBlock[]
}

export interface DeckDocument {
  next_id: number
  slides: DeckSlide[]
}

export interface DeckMetadata {
  type: 'mdeck'
  title: string
  created: number
  modified: number
}

export interface MiraDeckFile {
  metadata: DeckMetadata
  data: DeckDocument
}
