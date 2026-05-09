export interface MatrixCell {
  v?: string | number
  f?: string
}

export interface MatrixSheet {
  id: number
  name: string
  cells: Record<string, MatrixCell>
}

export interface MatrixDocument {
  next_id: number
  sheets: MatrixSheet[]
}

export interface MatrixMetadata {
  type: 'mtrx'
  title: string
  created: number
  modified: number
}

export interface MiraMatrixFile {
  metadata: MatrixMetadata
  data: MatrixDocument
}
