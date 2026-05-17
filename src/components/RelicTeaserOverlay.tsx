import { RELICS, CATEGORY_COLORS, CATEGORY_LABELS } from '../data/relics'
import { useGameStore, procesionFervorCost } from '../store/useGameStore'
import { TUTORIAL_QUESTS } from '../data/tutorialQuests'

interface Props {
  relicId: string
  onClose: () => void
  onViewFull: () => void
}

function distanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

export function RelicTeaserOverlay({ relicId, onClose, onViewFull }: Props) {
  const relic = RELICS.find(r => r.id === relicId)
  const pilgrimLat = useGameStore(s => s.pilgrimLat)
  const pilgrimLng = useGameStore(s => s.pilgrimLng)
  const isCollected = useGameStore(s => s.collected.includes(relicId))
  const processingRelicId = useGameStore(s => s.processingRelicId)
  const tutorialStep = useGameStore(s => s.tutorialStep)
  const beginProcession = useGameStore(s => s.beginProcession)
  const setTeaserRelic = useGameStore(s => s.setTeaserRelic)
  const fervor = useGameStore(s => s.fervor)
  const beginWalk = useGameStore(s => s.beginWalk)
  const walkingFervorCost = useGameStore(s => s.walkingFervorCost)

  if (!relic) return null

  const color = CATEGORY_COLORS[relic.category]
  const dist = distanceM(pilgrimLat, pilgrimLng, relic.lat, relic.lng)
  const isBusy = processingRelicId !== null
  const fervorCost = procesionFervorCost(relic.points)
  const canAfford = fervor >= fervorCost
  const walkCost = walkingFervorCost([pilgrimLat, pilgrimLng], [relic.lat, relic.lng])
  const canWalk = fervor >= walkCost

  const tutorialHint = tutorialStep === 1 ? TUTORIAL_QUESTS[0].hint : null

  function handleBeginProcession() {
    if (!canAfford) return
    beginProcession(relicId)
    setTeaserRelic(null)
  }

  function handleWalk() {
    if (!canWalk) return
    beginWalk([relic!.lat, relic!.lng])
    setTeaserRelic(null)
  }

  const SIZE = 72

  return (
    <div className="teaser-backdrop" onClick={onClose}>
      <div className="teaser-card" onClick={e => e.stopPropagation()}>
        {/* Category ring */}
        <div className="teaser-ring-wrap">
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <circle
              cx={SIZE / 2} cy={SIZE / 2}
              r={SIZE / 2 - 8}
              fill="none"
              stroke={color}
              strokeWidth={14}
            />
            {isCollected && (
              <circle
                cx={SIZE / 2} cy={SIZE / 2}
                r={SIZE / 2 - 8}
                fill={color}
                fillOpacity={0.22}
                stroke="none"
              />
            )}
          </svg>
        </div>

        {/* Category + Latin name */}
        <div className="teaser-category" style={{ color }}>
          {CATEGORY_LABELS[relic.category]}
        </div>
        <div className="teaser-name-latin">
          <em>{relic.nameLocal}</em>
        </div>
        <div className="teaser-church">{relic.church}</div>

        {isCollected ? (
          <>
            <div className="teaser-collected-badge">✦ Already venerated</div>
            <div className="teaser-distance">{dist < 1000 ? `${dist} m` : `${(dist / 1000).toFixed(1)} km`} away</div>
            <button
              className="teaser-btn-walk"
              style={{ width: '100%', margin: '8px 0' }}
              disabled={isBusy || !canWalk}
              onClick={handleWalk}
            >
              ⚑ Walk there<span className="teaser-btn-cost">−{walkCost} Fervor</span>
            </button>
            <button className="teaser-link" onClick={onViewFull}>View full record →</button>
          </>
        ) : (
          <>
            <div className="teaser-distance">{dist < 1000 ? `${dist} m` : `${(dist / 1000).toFixed(1)} km`} away</div>

            {tutorialHint && (
              <div className="teaser-hint"><em>{tutorialHint}</em></div>
            )}

            <div className="teaser-fervor-cost">
              <span className="teaser-fervor-label">Fervor required:</span>
              <span className={`teaser-fervor-val ${canAfford ? '' : 'teaser-fervor-insufficient'}`}>
                {fervorCost} / {fervor}
              </span>
            </div>

            {!canAfford && (
              <div className="teaser-fervor-warning">
                Insufficient Fervor. Rest at a church, kloster, or tavern first.
              </div>
            )}

            <div className="teaser-action-row">
              <button
                className="teaser-btn-walk"
                disabled={isBusy || !canWalk}
                onClick={handleWalk}
                title={`Walk to this church (−${walkCost} Fervor, no collection)`}
              >
                ⚑ Walk there<span className="teaser-btn-cost">−{walkCost}</span>
              </button>
              <button
                className="teaser-btn-procession"
                disabled={isBusy || !canAfford}
                onClick={handleBeginProcession}
                title={`Full procession — collect the relic (−${fervorCost} Fervor)`}
              >
                ⚜ Procession<span className="teaser-btn-cost">−{fervorCost}</span>
              </button>
            </div>

            <button className="teaser-link" onClick={onViewFull}>
              See full record in Codex →
            </button>
          </>
        )}

        <button className="teaser-close" onClick={onClose} aria-label="Close">✕</button>
      </div>
    </div>
  )
}
