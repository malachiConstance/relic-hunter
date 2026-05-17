import { useState } from 'react'
import { CastleArt } from './CastleArt'

interface Props {
  onRest: () => void      // opens castello rest panel
  onExplore: () => void   // dismisses intro, player explores map
}

export function IntroScreen({ onRest, onExplore }: Props) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  function handleRest() {
    setDismissed(true)
    onRest()
  }

  function handleExplore() {
    setDismissed(true)
    onExplore()
  }

  return (
    <div className="intro-overlay">
      <div className="intro-card">
        <div className="intro-castle-art">
          <CastleArt />
        </div>
        <div className="intro-title-block">
          <div className="intro-subtitle">Anno Domini MCCCCLXX · Milano</div>
          <h1 className="intro-title">Castello Sforzesco</h1>
        </div>

        <div className="intro-body">
          <p>
            You have arrived at last. The great towers of the Castello Sforzesco rise before you,
            their brickwork amber in the afternoon light. The courtyards bustle with merchants,
            soldiers, pilgrims from every corner of Christendom.
          </p>
          <p>
            The guides warned of an early winter — exceptional snow through the Alpine passes, weeks
            of cold and mud. Your spirit is depleted. Your body aches. The thought of the Duomo,
            barely a mile south, fills you with longing and dread in equal measure.
          </p>
          <p>
            The Holy Nail waits there. The most sacred relic in all of Lombardy. But you cannot
            attempt the great procession in this state — not yet. First you must rest, pray,
            let God restore your <em>Fervor Spiritalis</em>.
          </p>
          <p className="intro-question">
            What do you do?
          </p>
        </div>

        <div className="intro-actions">
          <button className="intro-btn intro-btn-primary" onClick={handleRest}>
            <span className="intro-btn-icon">✝</span>
            <span>
              <span className="intro-btn-label">Seek rest in the chapel</span>
              <span className="intro-btn-hint">Pray, restore Fervor, meet fellow pilgrims</span>
            </span>
          </button>
          <button className="intro-btn intro-btn-secondary" onClick={handleExplore}>
            <span className="intro-btn-icon">⚜</span>
            <span>
              <span className="intro-btn-label">Walk the fortress grounds</span>
              <span className="intro-btn-hint">Explore the map on your own terms</span>
            </span>
          </button>
        </div>

        <div className="intro-fervor-warning">
          ♦ Fervor: 20 / 100 — too depleted for a procession to the Duomo
        </div>
      </div>
    </div>
  )
}
