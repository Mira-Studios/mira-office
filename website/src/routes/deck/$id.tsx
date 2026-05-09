import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Download, Plus, Square, Trash2, Type } from 'lucide-react'
import { useToolbar } from '../../contexts/ToolbarContext'
import { useDeck } from '../../contexts/DeckContext'
import { DeckBlock, DeckBlockType, DeckSlide } from '../../types/deck'

export const Route = createFileRoute('/deck/$id')({
  component: DeckIdComponent,
})

function DeckIdComponent() {
  const { id } = Route.useParams()
  const { setToolbar } = useToolbar()
  const { file, setDeckData } = useDeck()
  const deck = file.data
  const [selectedSlideId, setSelectedSlideId] = useState<number>(1)

  const selectedSlide = useMemo(
    () => deck.slides.find((slide) => slide.id === selectedSlideId) ?? deck.slides[0],
    [deck.slides, selectedSlideId]
  )

  const updateSlide = (slideId: number, updater: (slide: DeckSlide) => DeckSlide) => {
    setDeckData({
      ...deck,
      slides: deck.slides.map((slide) => slide.id === slideId ? updater(slide) : slide)
    })
  }

  const addSlide = () => {
    const newSlideId = deck.next_id
    setDeckData({
      next_id: deck.next_id + 1,
      slides: [
        ...deck.slides,
        {
          id: newSlideId,
          bg: '#ffffff',
          next_block_id: 1,
          blocks: []
        }
      ]
    })
    setSelectedSlideId(newSlideId)
  }

  const addBlock = (type: DeckBlockType) => {
    if (!selectedSlide) return
    updateSlide(selectedSlide.id, (slide) => ({
      ...slide,
      blocks: [
        ...slide.blocks,
        {
          id: slide.next_block_id,
          type,
          t: type === 'h1' ? 'New Title' : 'New text',
          x: 100,
          y: 100 + slide.blocks.length * 70
        }
      ],
      next_block_id: slide.next_block_id + 1
    }))
  }

  const updateBlock = (blockId: number, updates: Partial<DeckBlock>) => {
    if (!selectedSlide) return
    updateSlide(selectedSlide.id, (slide) => ({
      ...slide,
      blocks: slide.blocks.map((block) => block.id === blockId ? { ...block, ...updates } : block)
    }))
  }

  const deleteBlock = (blockId: number) => {
    if (!selectedSlide) return
    updateSlide(selectedSlide.id, (slide) => ({
      ...slide,
      blocks: slide.blocks.filter((block) => block.id !== blockId)
    }))
  }

  useEffect(() => {
    if (selectedSlide && !deck.slides.some((slide) => slide.id === selectedSlideId)) {
      setSelectedSlideId(selectedSlide.id)
    }
  }, [deck.slides, selectedSlide, selectedSlideId])

  useEffect(() => {
    function DeckToolbar() {
      const { file, updateTitle: doUpdateTitle, exportDeck: doExport } = useDeck()
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button className="icon-btn" onClick={addSlide} title="Add Slide">
              <Plus size={16} />
            </button>
            <button className="icon-btn" onClick={() => addBlock('h1')} title="Add Title">
              <Type size={16} />
            </button>
            <button className="icon-btn" onClick={() => addBlock('p')} title="Add Text">
              <Square size={16} />
            </button>
          </div>
        </div>
      )
    }

    setToolbar(<DeckToolbar />)
    return () => setToolbar(null)
  }, [setToolbar, file.metadata.title, deck.next_id, selectedSlide?.id])

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)'
    }}>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <aside style={{
          width: '220px',
          borderRight: '1px solid var(--line)',
          background: 'var(--surface)',
          padding: '1rem',
          overflow: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <strong style={{ color: 'var(--text)' }}>Slides</strong>
            <button className="icon-btn" onClick={addSlide}>
              <Plus size={14} />
            </button>
          </div>
          {deck.slides.map((slide) => (
            <button
              key={slide.id}
              onClick={() => setSelectedSlideId(slide.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                marginBottom: '0.75rem',
                border: slide.id === selectedSlide?.id ? '1px solid var(--primary)' : '1px solid var(--line)',
                background: 'white',
                borderRadius: '8px',
                padding: '0.75rem',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                Slide {slide.id}
              </div>
              <div style={{
                aspectRatio: '16 / 9',
                background: slide.bg,
                border: '1px solid var(--line)',
                borderRadius: '4px'
              }} />
            </button>
          ))}
        </aside>

        <div style={{ flex: 1, display: 'flex', padding: '1.5rem', gap: '1.5rem', minWidth: 0 }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <div style={{
              width: '100%',
              maxWidth: '960px',
              aspectRatio: '16 / 9',
              background: selectedSlide?.bg ?? '#ffffff',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              position: 'relative',
              boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
              overflow: 'hidden'
            }}>
              {(selectedSlide?.blocks ?? []).map((block) => (
                <div
                  key={block.id}
                  style={{
                    position: 'absolute',
                    left: `${block.x}px`,
                    top: `${block.y}px`,
                    fontSize: block.type === 'h1' ? '2.5rem' : '1.25rem',
                    fontWeight: block.type === 'h1' ? 700 : 400,
                    color: '#111',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {block.t}
                </div>
              ))}
            </div>
          </div>

          <aside style={{
            width: '320px',
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '1rem',
            overflow: 'auto'
          }}>
            {selectedSlide && (
              <>
                <div style={{ marginBottom: '1rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
                  Presentation ID: {id}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>
                    Slide Background
                  </label>
                  <input
                    type="color"
                    value={selectedSlide.bg}
                    onChange={(e) => updateSlide(selectedSlide.id, (slide) => ({ ...slide, bg: e.target.value }))}
                    style={{ width: '100%', height: '42px', border: '1px solid var(--line)', borderRadius: '8px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <strong style={{ color: 'var(--text)' }}>Blocks</strong>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-ghost" onClick={() => addBlock('h1')}>Title</button>
                    <button className="btn btn-ghost" onClick={() => addBlock('p')}>Text</button>
                  </div>
                </div>

                {selectedSlide.blocks.map((block) => (
                  <div key={block.id} style={{
                    border: '1px solid var(--line)',
                    borderRadius: '10px',
                    padding: '0.75rem',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <select
                        value={block.type}
                        onChange={(e) => updateBlock(block.id, { type: e.target.value as DeckBlockType })}
                        style={{ padding: '0.4rem', borderRadius: '6px' }}
                      >
                        <option value="h1">h1</option>
                        <option value="p">p</option>
                      </select>
                      <button className="icon-btn" onClick={() => deleteBlock(block.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <textarea
                      value={block.t}
                      onChange={(e) => updateBlock(block.id, { t: e.target.value })}
                      rows={3}
                      style={{ width: '100%', resize: 'vertical', marginBottom: '0.75rem', padding: '0.5rem', borderRadius: '8px' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <input
                        type="number"
                        value={block.x}
                        onChange={(e) => updateBlock(block.id, { x: Number(e.target.value) })}
                        placeholder="x"
                        style={{ padding: '0.5rem', borderRadius: '8px' }}
                      />
                      <input
                        type="number"
                        value={block.y}
                        onChange={(e) => updateBlock(block.id, { y: Number(e.target.value) })}
                        placeholder="y"
                        style={{ padding: '0.5rem', borderRadius: '8px' }}
                      />
                    </div>
                  </div>
                ))}

                {selectedSlide.blocks.length === 0 && (
                  <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                    No blocks yet. Add a title or text block to start.
                  </div>
                )}
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
