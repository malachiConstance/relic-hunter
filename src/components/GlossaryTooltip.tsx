import { useState, useRef } from 'react'
import { GAME_DOC } from '../data/gameDocParser'

interface Props {
  termId: string
  children: React.ReactNode
}

export function GlossaryTooltip({ termId, children }: Props) {
  const term = GAME_DOC.glossaryMap.get(termId)
  const [visible, setVisible] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!term) return <>{children}</>

  function show() {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setVisible(true)
  }
  function hide() {
    hideTimer.current = setTimeout(() => setVisible(false), 120)
  }

  return (
    <span
      className="glossary-term"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      tabIndex={0}
    >
      {children}
      {visible && (
        <span className="glossary-tooltip" onMouseEnter={show} onMouseLeave={hide}>
          <span className="glossary-tooltip-word">{term.word}</span>
          <span className="glossary-tooltip-short">{term.short}</span>
        </span>
      )}
    </span>
  )
}
