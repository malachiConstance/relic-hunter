import { useEffect, useState } from 'react'
import { RELICS, CATEGORY_COLORS, CATEGORY_LABELS, VENERATION_COLORS } from '../data/relics'
import { useGameStore } from '../store/useGameStore'
import { RelicQuizPanel } from './RelicQuizPanel'

interface Props {
  relicId: string
  onNavigateToChapel: () => void
}

type Phase = 'dim' | 'burst' | 'reveal' | 'quiz' | 'pass' | 'fail'

function formatMs(ms: number): string {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function ArrivalCeremony({ relicId, onNavigateToChapel }: Props) {
  const relic = RELICS.find(r => r.id === relicId)
  const completeCeremony = useGameStore(s => s.completeCeremony)
  const failQuiz = useGameStore(s => s.failQuiz)
  const getQuizCooldownMs = useGameStore(s => s.getQuizCooldownMs)
  const [phase, setPhase] = useState<Phase>('dim')
  const [dismissed, setDismissed] = useState(false)
  const [cooldownMs, setCooldownMs] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('burst'), 600),
      setTimeout(() => setPhase('reveal'), 1400),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  // Tick down cooldown display when on fail screen
  useEffect(() => {
    if (phase !== 'fail') return
    const interval = setInterval(() => {
      const ms = getQuizCooldownMs(relicId)
      setCooldownMs(ms)
      if (ms <= 0) clearInterval(interval)
    }, 1000)
    setCooldownMs(getQuizCooldownMs(relicId))
    return () => clearInterval(interval)
  }, [phase])  // eslint-disable-line react-hooks/exhaustive-deps

  if (!relic || dismissed) return null

  const isFullCeremony = relic.rarity === 'Legendary' || relic.theological_dignity === 'Primaria'
  const catColor = CATEGORY_COLORS[relic.category]
  const venColor = VENERATION_COLORS[relic.veneration_type]

  function handleContinue() {
    setDismissed(true)
    completeCeremony()
  }

  function handlePlaceInChapel() {
    setDismissed(true)
    completeCeremony()
    onNavigateToChapel()
  }

  function handleQuizPass() {
    setPhase('pass')
  }

  function handleQuizFail() {
    failQuiz(relicId)
    setPhase('fail')
  }

  function handleFailDismiss() {
    setDismissed(true)
  }

  const overlayOpacity = phase === 'dim' ? 0 : 0.65

  return (
    <div
      className="ceremony-backdrop"
      style={{ '--overlay-opacity': overlayOpacity } as React.CSSProperties}
    >
      {/* Particle burst */}
      {(phase === 'burst' || phase === 'reveal' || phase === 'quiz' || phase === 'pass') && (
        <div className="ceremony-burst">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="ceremony-particle"
              style={{ '--angle': `${i * 36}deg`, '--color': catColor } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Relic reveal card */}
      {(phase === 'reveal' || phase === 'quiz' || phase === 'pass') && (
        <div className={`ceremony-card ${phase === 'reveal' ? 'ceremony-card-enter' : ''}`}>
          <div className="ceremony-header" style={{ borderColor: catColor }}>
            <div className="ceremony-newly-venerated" style={{ color: catColor }}>
              ✦ {phase === 'pass' ? 'Relic Acquired' : 'You Have Arrived'}
            </div>
            <div className="ceremony-relic-name">{relic.name}</div>
            <div className="ceremony-relic-latin"><em>{relic.nameLocal}</em></div>
          </div>

          <div className="ceremony-badges">
            <span className="ceremony-badge" style={{ borderColor: catColor, color: catColor }}>
              {CATEGORY_LABELS[relic.category]}
            </span>
            <span className="ceremony-badge" style={{ borderColor: venColor, color: venColor }}>
              {relic.veneration_type}
            </span>
            <span className="ceremony-badge" style={{ borderColor: '#C9A84C', color: '#C9A84C' }}>
              {relic.rarity}
            </span>
          </div>

          {isFullCeremony && (
            <>
              <div className="ceremony-axis-table">
                <div className="axis-row">
                  <span className="axis-label">Material</span>
                  <span className="axis-value">{relic.material_class} — {relic.material_sub}</span>
                </div>
                <div className="axis-row">
                  <span className="axis-label">Provenance</span>
                  <span className="axis-value">{relic.provenance_class} — {relic.provenance_sub}</span>
                </div>
                <div className="axis-row">
                  <span className="axis-label">Dignity</span>
                  <span className="axis-value">{relic.theological_dignity}</span>
                </div>
              </div>
              <div className="ceremony-lore">{relic.description}</div>
              <div className="ceremony-fact"><em>✦ {relic.interestingFact}</em></div>
            </>
          )}

          {!isFullCeremony && (
            <div className="ceremony-lore-short">{relic.description}</div>
          )}

          {/* Quiz phase */}
          {phase === 'reveal' && (
            <button
              className="ceremony-btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => setPhase('quiz')}
            >
              Begin Examination →
            </button>
          )}

          {phase === 'quiz' && (
            <RelicQuizPanel
              relicId={relicId}
              onPass={handleQuizPass}
              onFail={handleQuizFail}
            />
          )}

          {phase === 'pass' && (
            <div className="ceremony-pass-message">
              <div className="ceremony-pass-title">✦ Bene responsum!</div>
              <div className="ceremony-pass-sub">The relic is yours to venerate.</div>
              <div className="ceremony-actions" style={{ marginTop: 14 }}>
                <button className="ceremony-btn-primary" onClick={handlePlaceInChapel}>
                  Place in Chapel →
                </button>
                <button className="ceremony-btn-secondary" onClick={handleContinue}>
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fail screen */}
      {phase === 'fail' && (
        <div className="ceremony-card ceremony-card-enter">
          <div className="ceremony-fail-icon">✝</div>
          <div className="ceremony-fail-title">Meditare et Ora</div>
          <div className="ceremony-fail-text">
            <em>Your knowledge is not yet sufficient. Go to another place, rest, and pray. Return when your spirit is ready.</em>
          </div>
          {cooldownMs > 0 && (
            <div className="ceremony-cooldown">
              Return in: <strong>{formatMs(cooldownMs)}</strong>
            </div>
          )}
          <button className="ceremony-btn-secondary" style={{ marginTop: 20 }} onClick={handleFailDismiss}>
            I will return
          </button>
        </div>
      )}
    </div>
  )
}
