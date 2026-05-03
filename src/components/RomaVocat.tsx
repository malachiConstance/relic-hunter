import { useEffect, useState } from 'react'

interface Props {
  onDismiss: () => void
}

export function RomaVocat({ onDismiss }: Props) {
  const [phase, setPhase] = useState<'in' | 'text' | 'out'>('in')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 800)
    const t2 = setTimeout(() => setPhase('out'), 4500)
    const t3 = setTimeout(() => onDismiss(), 5500)
    return () => [t1, t2, t3].forEach(clearTimeout)
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`roma-vocat-backdrop ${phase === 'out' ? 'roma-vocat-fade-out' : 'roma-vocat-fade-in'}`}>
      <div className={`roma-vocat-text ${phase === 'text' || phase === 'out' ? 'roma-vocat-text-visible' : ''}`}>
        <div className="roma-vocat-line1">Omnia completa sunt.</div>
        <div className="roma-vocat-line2">Roma Vocat.</div>
        <div className="roma-vocat-cross">✝</div>
      </div>
      <button className="roma-vocat-skip" onClick={onDismiss}>continue →</button>
    </div>
  )
}
