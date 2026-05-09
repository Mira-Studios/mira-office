import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Download, Plus } from 'lucide-react'
import { useToolbar } from '../../contexts/ToolbarContext'
import { useMatrix } from '../../contexts/MatrixContext'
import { MatrixCell, MatrixSheet } from '../../types/matrix'

const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const rowCount = 20

export const Route = createFileRoute('/matrix/$id')({
  component: MatrixIdComponent,
})

function MatrixIdComponent() {
  const { id } = Route.useParams()
  const { setToolbar } = useToolbar()
  const { file, setMatrixData } = useMatrix()
  const matrix = file.data
  const [selectedSheetId, setSelectedSheetId] = useState<number>(1)
  const [selectedCell, setSelectedCell] = useState<string>('A1')

  const selectedSheet = useMemo(
    () => matrix.sheets.find((sheet) => sheet.id === selectedSheetId) ?? matrix.sheets[0],
    [matrix.sheets, selectedSheetId]
  )

  const updateSheet = (sheetId: number, updater: (sheet: MatrixSheet) => MatrixSheet) => {
    setMatrixData({
      ...matrix,
      sheets: matrix.sheets.map((sheet) => sheet.id === sheetId ? updater(sheet) : sheet)
    })
  }

  const addSheet = () => {
    const newSheetId = matrix.next_id
    setMatrixData({
      next_id: matrix.next_id + 1,
      sheets: [
        ...matrix.sheets,
        {
          id: newSheetId,
          name: `Sheet ${newSheetId}`,
          cells: {}
        }
      ]
    })
    setSelectedSheetId(newSheetId)
  }

  const updateCell = (cellKey: string, patch: MatrixCell) => {
    if (!selectedSheet) return
    updateSheet(selectedSheet.id, (sheet) => ({
      ...sheet,
      cells: {
        ...sheet.cells,
        [cellKey]: patch
      }
    }))
  }

  const activeCell = selectedSheet?.cells[selectedCell] ?? {}
  const activeFormula = activeCell.f ?? ''
  const activeDisplayValue = activeCell.v === undefined ? '' : String(activeCell.v)

  useEffect(() => {
    function MatrixToolbar() {
      const { file, updateTitle: doUpdateTitle, exportMatrix: doExport } = useMatrix()
      const [titleLocal, setTitleLocal] = useState(file.metadata.title)

      useEffect(() => {
        setTitleLocal(file.metadata.title)
      }, [file.metadata.title])

      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <input
            type="text"
            value={titleLocal}
            onChange={(e) => setTitleLocal(e.target.value)}
            onBlur={() => doUpdateTitle(titleLocal)}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--text)',
              background: 'transparent',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              minWidth: '220px'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0 1rem', borderLeft: '1px solid var(--line)', borderRight: '1px solid var(--line)' }}>
            <button className="btn btn-secondary" style={{ fontSize: '0.875rem' }} onClick={() => doUpdateTitle(titleLocal)}>
              Save
            </button>
            <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem' }} onClick={doExport}>
              <Download size={14} />
              Export
            </button>
          </div>

          <button className="icon-btn" onClick={addSheet} title="Add Sheet">
            <Plus size={16} />
          </button>
        </div>
      )
    }

    setToolbar(<MatrixToolbar />)
    return () => setToolbar(null)
  }, [setToolbar, file.metadata.title, matrix.next_id])

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)'
    }}>
      <div style={{ padding: '1rem 1.5rem 0', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {matrix.sheets.map((sheet) => (
          <button
            key={sheet.id}
            onClick={() => setSelectedSheetId(sheet.id)}
            style={{
              padding: '0.6rem 0.9rem',
              borderRadius: '999px',
              border: sheet.id === selectedSheet?.id ? '1px solid var(--primary)' : '1px solid var(--line)',
              background: sheet.id === selectedSheet?.id ? 'var(--bg-accent-a)' : 'var(--surface)',
              cursor: 'pointer',
              color: 'var(--text)'
            }}
          >
            {sheet.name}
          </button>
        ))}
      </div>

      {selectedSheet && (
        <div style={{ flex: 1, padding: '1rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr 1fr',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <input
              type="text"
              value={selectedSheet.name}
              onChange={(e) => updateSheet(selectedSheet.id, (sheet) => ({ ...sheet, name: e.target.value }))}
              style={{ padding: '0.6rem 0.75rem', borderRadius: '8px' }}
            />
            <input
              type="text"
              value={activeFormula}
              onChange={(e) => updateCell(selectedCell, { ...activeCell, f: e.target.value || undefined })}
              placeholder={`Formula for ${selectedCell}`}
              style={{ padding: '0.6rem 0.75rem', borderRadius: '8px' }}
            />
            <input
              type="text"
              value={activeDisplayValue}
              onChange={(e) => {
                const raw = e.target.value
                const numeric = raw !== '' && !Number.isNaN(Number(raw)) ? Number(raw) : raw
                updateCell(selectedCell, { ...activeCell, v: raw === '' ? undefined : numeric })
              }}
              placeholder={`Value for ${selectedCell}`}
              style={{ padding: '0.6rem 0.75rem', borderRadius: '8px' }}
            />
          </div>

          <div style={{ marginBottom: '0.75rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
            Spreadsheet ID: {id}
          </div>

          <div style={{
            flex: 1,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            overflow: 'auto'
          }}>
            <div style={{ minWidth: '820px' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', background: 'var(--bg-accent-a)' }}>
                <div style={{ width: '56px', padding: '0.5rem', borderRight: '1px solid var(--line)' }} />
                {columns.map((column) => (
                  <div
                    key={column}
                    style={{
                      flex: 1,
                      minWidth: '95px',
                      padding: '0.5rem',
                      borderRight: '1px solid var(--line)',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: 'var(--muted)'
                    }}
                  >
                    {column}
                  </div>
                ))}
              </div>

              {Array.from({ length: rowCount }, (_, rowIndex) => {
                const row = rowIndex + 1
                return (
                  <div key={row} style={{ display: 'flex', borderBottom: '1px solid var(--line)' }}>
                    <div style={{
                      width: '56px',
                      padding: '0.5rem',
                      borderRight: '1px solid var(--line)',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: 'var(--muted)',
                      background: 'var(--bg-accent-a)'
                    }}>
                      {row}
                    </div>

                    {columns.map((column) => {
                      const cellKey = `${column}${row}`
                      const cell = selectedSheet.cells[cellKey]
                      const value = cell?.v === undefined ? '' : String(cell.v)
                      return (
                        <input
                          key={cellKey}
                          type="text"
                          value={value}
                          onFocus={() => setSelectedCell(cellKey)}
                          onChange={(e) => {
                            const raw = e.target.value
                            const numeric = raw !== '' && !Number.isNaN(Number(raw)) ? Number(raw) : raw
                            updateCell(cellKey, { ...cell, v: raw === '' ? undefined : numeric })
                          }}
                          style={{
                            flex: 1,
                            minWidth: '95px',
                            padding: '0.5rem',
                            border: 'none',
                            borderRight: '1px solid var(--line)',
                            outline: selectedCell === cellKey ? '2px solid var(--primary)' : 'none',
                            outlineOffset: '-2px',
                            background: 'transparent',
                            color: 'var(--text)'
                          }}
                        />
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
