import { useEffect, useState } from 'react'
import {
  RELICS,
  MILAN_RELICS,
  CATEGORY_COLORS,
  VENERATION_COLORS,
  CATEGORY_LABELS,
  type Relic,
} from '../data/relics'
import { useGameStore } from '../store/useGameStore'
import { getActiveFeastToday } from '../data/liturgicalCalendar'

interface Props {
  onClose: () => void
}

const VENERATION_GLOW: Record<string, string> = {
  Latria: '0 0 18px 4px rgba(201,168,76,0.7)',
  Hyperdulia: '0 0 18px 4px rgba(232,160,180,0.6)',
  Dulia: '0 0 12px 3px rgba(154,184,200,0.5)',
}

const VENERATION_PARTICLE: Record<string, string> = {
  Latria: '✦',
  Hyperdulia: '✿',
  Dulia: '·',
}

function RelicSlot({ relic, collected }: { relic: Relic; collected: boolean }) {
  const catColor = CATEGORY_COLORS[relic.category]
  const venColor = VENERATION_COLORS[relic.veneration_type]
  const glow = collected ? VENERATION_GLOW[relic.veneration_type] : 'none'
  const particle = VENERATION_PARTICLE[relic.veneration_type]

  if (!collected) {
    return (
      <div className="chapel-slot chapel-slot-empty" title={`Hic manet Reliquia ${relic.category}…`}>
        <div className="chapel-slot-shadow">
          <svg width="28" height="36" viewBox="0 0 32 40" opacity="0.2">
            <path
              d="M16 2 C8 2 3 8 3 15 C3 24 16 38 16 38 C16 38 29 24 29 15 C29 8 24 2 16 2Z"
              fill={catColor}
              stroke={catColor}
              strokeWidth="1"
              strokeDasharray="3,2"
            />
          </svg>
        </div>
        <div className="chapel-slot-hint">
          {relic.city === 'rome' ? '🔒' : '?'}
        </div>
      </div>
    )
  }

  return (
    <div
      className="chapel-slot chapel-slot-filled"
      style={{ boxShadow: glow, borderColor: venColor }}
      title={relic.nameLocal}
    >
      <svg width="28" height="36" viewBox="0 0 32 40">
        <path
          d="M16 2 C8 2 3 8 3 15 C3 24 16 38 16 38 C16 38 29 24 29 15 C29 8 24 2 16 2Z"
          fill={catColor}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="1"
        />
        <circle cx="16" cy="15" r="6" fill="rgba(255,240,200,0.9)" stroke={catColor} strokeWidth="1" />
        <text x="16" y="19" textAnchor="middle" fontSize="8" fill={catColor}>{particle}</text>
      </svg>
      <div className="chapel-slot-cat" style={{ color: catColor }}>
        {CATEGORY_LABELS[relic.category].split(' ')[0]}
      </div>
    </div>
  )
}

type ChapelStyle = 'Gothic' | 'Baroque' | 'Ambrosian'

export function ReliquaryChapel({ onClose }: Props) {
  const { collected, holyEssence, earnedTitleLatins, activeBuffs } = useGameStore()
  const tutorialStep = useGameStore(s => s.tutorialStep)
  const advanceTutorial = useGameStore(s => s.advanceTutorial)
  const resetGame = useGameStore(s => s.resetGame)
  const [confirmReset, setConfirmReset] = useState(false)
  const collectedSet = new Set(collected)
  const activeFeast = getActiveFeastToday()

  // Tutorial step 5: opening Chapel with ≥3 relics completes the quest
  useEffect(() => {
    if (tutorialStep === 5 && collected.length >= 3) {
      advanceTutorial()
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const milanCollected = MILAN_RELICS.filter(r => collectedSet.has(r.id))
  const totalPoints = milanCollected.reduce((s, r) => s + r.points, 0)

  // Group relics by veneration type for the chapel wall
  const latriaRelics = RELICS.filter(r => r.veneration_type === 'Latria')
  const hyperduliaRelics = RELICS.filter(r => r.veneration_type === 'Hyperdulia')
  const duliaRelics = RELICS.filter(r => r.veneration_type === 'Dulia')

  const chapelStyle: ChapelStyle = milanCollected.length >= 8
    ? 'Baroque'
    : milanCollected.length >= 4
    ? 'Ambrosian'
    : 'Gothic'

  const now = Date.now()
  const activeBuffsList = activeBuffs.filter(b => b.expiresAt > now)

  return (
    <div className="chapel-overlay" onClick={onClose}>
      <div className={`chapel-panel chapel-style-${chapelStyle.toLowerCase()}`} onClick={e => e.stopPropagation()}>
        <button className="relic-card-close" onClick={onClose}>✕</button>

        {/* Header */}
        <div className="chapel-header">
          <h2 className="chapel-title">Reliquary Chapel</h2>
          <p className="chapel-subtitle">
            <em>Sacellum Reliquiarum — {chapelStyle} Rite</em>
          </p>
        </div>

        {/* Holy Essence */}
        <div className="chapel-essence">
          <div className="chapel-essence-icon">✦</div>
          <div className="chapel-essence-amount">{holyEssence.toLocaleString()}</div>
          <div className="chapel-essence-label">Holy Essence</div>
        </div>

        {/* Active feast */}
        {activeFeast && (
          <div className="chapel-feast">
            ✶ <em>{activeFeast.latinName}</em> — {activeFeast.flavorText}
          </div>
        )}

        {/* Active buffs */}
        {activeBuffsList.length > 0 && (
          <div className="chapel-buffs">
            <div className="chapel-buffs-title">Active Blessings</div>
            {activeBuffsList.map((ab, i) => {
              const hoursLeft = Math.ceil((ab.expiresAt - now) / (1000 * 60 * 60))
              return (
                <div key={i} className="chapel-buff">
                  <span className="chapel-buff-name">{ab.buff.latinName}</span>
                  <span className="chapel-buff-effect">{ab.buff.effect}</span>
                  <span className="chapel-buff-timer">{hoursLeft}h remaining</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Titles */}
        {earnedTitleLatins.length > 0 && (
          <div className="chapel-titles">
            <div className="chapel-titles-label">Tituli Consecrati</div>
            {earnedTitleLatins.map(t => (
              <span key={t} className="chapel-title-badge">{t}</span>
            ))}
          </div>
        )}

        {/* Stats bar */}
        <div className="chapel-stats">
          <div className="chapel-stat">
            <div className="chapel-stat-num">{milanCollected.length}</div>
            <div className="chapel-stat-lbl">Relics</div>
          </div>
          <div className="chapel-stat">
            <div className="chapel-stat-num">{totalPoints.toLocaleString()}</div>
            <div className="chapel-stat-lbl">Points</div>
          </div>
          <div className="chapel-stat">
            <div className="chapel-stat-num">{Math.round((milanCollected.length / MILAN_RELICS.length) * 100)}%</div>
            <div className="chapel-stat-lbl">Milano</div>
          </div>
        </div>

        {/* Wall sections */}
        <div className="chapel-wall">

          {/* Latria section — Passion Instruments */}
          {latriaRelics.length > 0 && (
            <div className="chapel-section chapel-latria">
              <div className="chapel-section-title" style={{ color: '#C9A84C' }}>
                ✝ Instrumenta Passionis — Latria
              </div>
              <div className="chapel-slots">
                {latriaRelics.map(r => (
                  <RelicSlot key={r.id} relic={r} collected={collectedSet.has(r.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Hyperdulia section — Marian */}
          {hyperduliaRelics.length > 0 && (
            <div className="chapel-section chapel-hyperdulia">
              <div className="chapel-section-title" style={{ color: '#E8A0B4' }}>
                ✿ Deiparae — Hyperdulia
              </div>
              <div className="chapel-slots">
                {hyperduliaRelics.map(r => (
                  <RelicSlot key={r.id} relic={r} collected={collectedSet.has(r.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Dulia section — Saints */}
          <div className="chapel-section chapel-dulia">
            <div className="chapel-section-title" style={{ color: '#9AB8C8' }}>
              ⊕ Sanctorum — Dulia
            </div>
            <div className="chapel-slots">
              {duliaRelics.map(r => (
                <RelicSlot key={r.id} relic={r} collected={collectedSet.has(r.id)} />
              ))}
            </div>
          </div>

        </div>

        {/* Bottom quote */}
        <div className="chapel-quote">
          <em>"Corpus enim per Spiritum sanctum templum est"</em>
          <span> — S. Paulus, 1 Cor 6:19</span>
        </div>

        {/* Restart */}
        <div className="chapel-restart-wrap">
          <button className="chapel-restart-btn" onClick={() => setConfirmReset(true)}>
            Redde Omnia Deo
          </button>
        </div>

        {/* Confirmation dialog */}
        {confirmReset && (
          <div className="reset-backdrop" onClick={() => setConfirmReset(false)}>
            <div className="reset-dialog" onClick={e => e.stopPropagation()}>
              <div className="reset-title">Resignatio Generalis</div>
              <div className="reset-latin">
                <em>Omnia quae collegisti Domino restitues. Via tua ab initio incipit.</em>
              </div>
              <div className="reset-warning">
                This will restart the game. All collected relics, Holy Essence, titles, and progress will be lost.
              </div>
              <div className="reset-actions">
                <button className="reset-btn-confirm" onClick={() => { resetGame(); setConfirmReset(false); onClose() }}>
                  Fiat — Restart
                </button>
                <button className="reset-btn-cancel" onClick={() => setConfirmReset(false)}>
                  Non fiat — Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
