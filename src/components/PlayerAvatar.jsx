const PALETTES = [
  ['#0d1f3c', '#c9a84c'], ['#112850', '#f0c060'],
  ['#091428', '#d4a843'], ['#0e2248', '#e8b84b'], ['#0a1a38', '#b8943e'],
]

export default function PlayerAvatar({ initials, size = 48, seed = 0 }) {
  const [bg, fg] = PALETTES[seed % PALETTES.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle at 35% 35%, ${bg}dd, ${bg})`,
      border: `2px solid ${fg}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 700, color: fg,
      fontFamily: "'Playfair Display', serif", flexShrink: 0,
      boxShadow: `0 2px 8px ${bg}66`,
    }}>
      {initials.slice(0, 2)}
    </div>
  )
}
