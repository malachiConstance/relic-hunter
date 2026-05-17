import { useEffect, useRef, useState } from 'react'

interface Props {
  /** Label shown when the button is ready to press. */
  label: string
  /** Label shown while the progress bar is running. */
  busyLabel?: string
  /** Small reward/cost hint shown beside the label when ready. */
  hint?: string
  /** Progress duration in milliseconds. */
  durationMs: number
  /**
   * 'cooldown' — pressing fires onActivate immediately, then the bar runs and
   * the button is locked until it finishes (repeatable).
   * 'gate' — the bar runs once on mount; the button is locked until it
   * finishes, then pressing fires onActivate.
   */
  mode: 'cooldown' | 'gate'
  onActivate: () => void
  className?: string
  disabled?: boolean
}

export function ProgressButton({
  label, busyLabel, hint, durationMs, mode, onActivate, className = '', disabled = false,
}: Props) {
  const [pct, setPct] = useState(0)
  const [busy, setBusy] = useState(mode === 'gate')
  const rafRef = useRef<number | null>(null)

  function runBar() {
    setBusy(true)
    setPct(0)
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(100, ((now - start) / durationMs) * 100)
      setPct(p)
      if (p < 100) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
        setBusy(false)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    if (mode === 'gate') runBar()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleClick() {
    if (busy || disabled) return
    if (mode === 'cooldown') {
      onActivate()
      runBar()
    } else {
      onActivate()
    }
  }

  return (
    <button
      className={`progress-btn ${className} ${busy ? 'progress-btn-busy' : ''}`}
      onClick={handleClick}
      disabled={busy || disabled}
    >
      {busy && <span className="progress-btn-fill" style={{ width: `${pct}%` }} />}
      <span className="progress-btn-label">
        {busy ? (busyLabel ?? label) : label}
        {hint && !busy && <span className="progress-btn-hint">{hint}</span>}
      </span>
    </button>
  )
}
