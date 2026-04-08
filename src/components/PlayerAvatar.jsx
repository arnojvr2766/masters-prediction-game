const PALETTES = [
  ['#1a3a2a', '#c9a84c'], ['#2d5a3d', '#f0c060'],
  ['#0f2419', '#d4a843'], ['#1e4530', '#e8b84b'], ['#152e20', '#b8943e'],
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
