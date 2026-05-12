import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { PLAYER_POOL, calculateScore, isPicksLocked } from '../lib/constants'
import PlayerAvatar from './PlayerAvatar'

const GOLD = '#c9a84c'
const G = '#0d1f3c'

export default function MyPicksScreen({ userId, onNav, liveResults }) {
  const [picks, setPicks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOverState] = useState(null)
  const locked = isPicksLocked()

  const listRef = useRef(null)
  const picksRef = useRef([])
  const dragState = useRef({ active: false, fromIdx: null })
  const dragOverRef = useRef(null)
  const finalizeRef = useRef(null)

  useEffect(() => { picksRef.current = picks }, [picks])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('picks').select('player_id, position').eq('user_id', userId).order('position')
      if (data) setPicks(data)
      setLoading(false)
    }
    if (userId) load()
  }, [userId])

  const setDragOver = (idx) => {
    dragOverRef.current = idx
    setDragOverState(idx)
  }

  const savePicks = async (newPicks) => {
    setSaving(true)
    await supabase.from('picks').upsert(
      newPicks.map(p => ({ user_id: userId, player_id: p.player_id, position: p.position })),
      { onConflict: 'user_id,player_id' }
    )
    setSaving(false)
  }

  // Keep finalize ref current so stale closure in event listener always calls latest version
  finalizeRef.current = () => {
    if (!dragState.current.active) return
    const fromIdx = dragState.current.fromIdx
    const toIdx = dragOverRef.current
    dragState.current = { active: false, fromIdx: null }
    dragOverRef.current = null
    setDragging(null)
    setDragOverState(null)
    if (fromIdx !== null && toIdx !== null && fromIdx !== toIdx) {
      const arr = [...picksRef.current]
      const [item] = arr.splice(fromIdx, 1)
      arr.splice(toIdx, 0, item)
      const reranked = arr.map((p, i) => ({ ...p, position: i + 1 }))
      picksRef.current = reranked
      setPicks(reranked)
      savePicks(reranked)
    }
  }

  useEffect(() => {
    const el = listRef.current
    if (!el) return

    const getIdx = (x, y) => {
      const target = document.elementFromPoint(x, y)
      const row = target?.closest('[data-pick-idx]')
      return row ? parseInt(row.getAttribute('data-pick-idx')) : null
    }

    const handleTouchMove = (e) => {
      if (!dragState.current.active) return
      e.preventDefault()
      const { clientX, clientY } = e.touches[0]
      const idx = getIdx(clientX, clientY)
      if (idx !== null) setDragOver(idx)
    }
    const handleTouchEnd = () => finalizeRef.current?.()
    const handleMouseMove = (e) => {
      if (!dragState.current.active) return
      const idx = getIdx(e.clientX, e.clientY)
      if (idx !== null) setDragOver(idx)
    }
    const handleMouseUp = () => finalizeRef.current?.()

    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const startDrag = (idx) => (e) => {
    if (locked) return
    e.preventDefault()
    dragState.current = { active: true, fromIdx: idx }
    setDragging(idx)
    setDragOver(idx)
  }

  const score = calculateScore(picks, liveResults)
  const ghostBtn = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: '8px 14px', color: '#8098b8', fontSize: 13, cursor: 'pointer' }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: GOLD, fontFamily: "'Playfair Display', serif" }}>Loading…</div>
    </div>
  )

  if (picks.length === 0) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>📋</div>
      <h2 style={{ color: '#f5f0e8', fontFamily: "'Playfair Display', serif", marginBottom: 20 }}>No picks yet</h2>
      <button onClick={() => onNav('picks')} style={{ ...ghostBtn, padding: '12px 24px' }}>Start picking →</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ padding: '14px 18px', position: 'sticky', top: 0, zIndex: 20, background: 'rgba(8,11,18,0.95)', backdropFilter: 'blur(14px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button onClick={() => onNav('picks')} style={ghostBtn}>← Edit</button>
          <div style={{ fontFamily: "'Playfair Display', serif", color: GOLD, fontSize: 17, fontWeight: 700 }}>My Picks</div>
          <button onClick={() => onNav('dashboard')} style={ghostBtn}>Home</button>
        </div>

        {score && (
          <div style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}2a`, borderRadius: 14, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, color: '#3a5a7a', marginBottom: 3, letterSpacing: 1 }}>CURRENT SCORE</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: GOLD, fontFamily: "'Playfair Display', serif" }}>{score.total}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#3a5a7a', marginBottom: 3, letterSpacing: 1 }}>EXACT MATCHES</div>
              <div style={{ fontSize: 28, color: '#4ade80', fontWeight: 700 }}>{score.breakdown.filter(b => b.exact).length}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#3a5a7a', marginBottom: 3, letterSpacing: 1 }}>PICKS</div>
              <div style={{ fontSize: 28, color: '#a0b8d8', fontWeight: 700 }}>{picks.length}/20</div>
            </div>
          </div>
        )}
      </div>

      {locked && (
        <div style={{ margin: '0 18px 12px', padding: '11px 16px', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: 11, fontSize: 12, color: '#f87171', textAlign: 'center' }}>
          🔒 Picks are locked. Closed Thu 14 May at 14:00 SAST.
        </div>
      )}

      {!locked && (
        <div style={{ margin: '0 18px 10px', padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, fontSize: 11, color: '#3a5a7a', textAlign: 'center' }}>
          Hold <span style={{ color: GOLD }}>⠿</span> and drag to reorder your picks
        </div>
      )}

      {saving && (
        <div style={{ margin: '0 18px 10px', padding: '8px 14px', background: `${GOLD}10`, borderRadius: 10, fontSize: 12, color: GOLD, textAlign: 'center' }}>Saving…</div>
      )}

      {/* Draggable picks list */}
      <div ref={listRef} style={{ padding: '0 14px' }}>
        {picks.map((pick, idx) => {
          const player = PLAYER_POOL.find(p => p.id === pick.player_id)
          const sd = score?.breakdown[idx]
          if (!player) return null
          const isDragging = dragging === idx
          const isOver = dragOver === idx && dragging !== null && dragging !== idx
          return (
            <div
              key={pick.player_id}
              data-pick-idx={idx}
              style={{
                display: 'flex', alignItems: 'center', gap: 11,
                padding: '11px 13px', marginBottom: 6,
                background: sd?.exact ? 'rgba(74,222,128,0.08)' : sd?.missedCut ? 'rgba(248,113,113,0.07)' : 'rgba(255,255,255,0.04)',
                border: isOver
                  ? `2px solid ${GOLD}88`
                  : sd?.exact ? '1px solid rgba(74,222,128,0.25)' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 13,
                opacity: isDragging ? 0.45 : 1,
                transform: isDragging ? 'scale(0.98)' : 'scale(1)',
                transition: isDragging ? 'none' : 'border 0.15s, opacity 0.15s',
                animation: !isDragging ? 'fadeIn 0.25s ease both' : 'none',
                animationDelay: `${idx * 30}ms`,
                userSelect: 'none',
              }}
            >
              {/* Rank badge */}
              <div style={{ width: 32, height: 32, borderRadius: 9, background: `${GOLD}20`, border: `1px solid ${GOLD}38`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: GOLD, flexShrink: 0 }}>
                {pick.position}
              </div>

              <PlayerAvatar initials={player.img} size={36} seed={player.id} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#f5f0e8', fontWeight: 600, fontSize: 13, marginBottom: 1 }}>{player.name}</div>
                <div style={{ fontSize: 10, color: '#3a5a7a' }}>
                  {sd?.actualPos != null ? `Actual: T${sd.actualPos}${sd.missedCut ? ' (MC)' : ''}` : 'Live: —'}
                </div>
              </div>

              {/* Score + drag handle */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                {sd?.exact && <span style={{ fontSize: 9, color: '#4ade80', fontWeight: 700, letterSpacing: 0.5 }}>EXACT!</span>}
                {sd && (
                  <div style={{ fontSize: 15, fontWeight: 800, color: sd.exact ? '#4ade80' : sd.points > 10 ? '#f87171' : GOLD }}>
                    {sd.points > 0 ? `+${sd.points}` : sd.points}
                  </div>
                )}
                {!locked && (
                  <div
                    onMouseDown={startDrag(idx)}
                    onTouchStart={startDrag(idx)}
                    style={{
                      padding: '2px 6px', cursor: 'grab', touchAction: 'none',
                      color: isOver ? GOLD : '#2a4a6a',
                      fontSize: 20, lineHeight: 1, borderRadius: 6,
                      background: isOver ? `${GOLD}18` : 'transparent',
                      transition: 'color 0.15s, background 0.15s',
                    }}
                  >
                    ⠿
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom CTA */}
      {!locked && picks.length < 20 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '14px 18px', background: 'rgba(8,11,18,0.94)', backdropFilter: 'blur(20px)', borderTop: `1px solid ${GOLD}2a` }}>
          <button onClick={() => onNav('picks')} style={{
            width: '100%', background: `${GOLD}30`, color: GOLD,
            border: `1px solid ${GOLD}40`, borderRadius: 13, padding: '14px',
            fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: "'Playfair Display', serif",
          }}>
            Add more players ({picks.length}/20)
          </button>
        </div>
      )}
    </div>
  )
}
