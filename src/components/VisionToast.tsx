import { useGameStore } from '../store/useGameStore'

const TYPE_COLORS = {
  devotio:      { bg: '#2A1A04', border: '#C9A84C', text: '#F5E6C8' },
  hint:         { bg: '#1E1A10', border: '#8A7A5A', text: '#E8D5A8' },
  rome_whisper: { bg: '#1A0A1E', border: '#6B4C8A', text: '#D4C0E8' },
}

export function VisionToast() {
  const vision = useGameStore(s => s.activeVision)
  if (!vision) return null

  const { bg, border, text } = TYPE_COLORS[vision.type]

  return (
    <div className="vision-toast" style={{ background: bg, borderColor: border, color: text }}>
      <span className="vision-toast-text">{vision.text}</span>
    </div>
  )
}
