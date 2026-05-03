import { type Relic, CATEGORY_LABELS, CATEGORY_COLORS } from '../data/relics'
import { useCollection } from '../hooks/useCollection'
import { useLocation } from '../hooks/useLocation'
import { useGameStore } from '../store/useGameStore'
import { distanceMetres, formatDistance } from '../utils/distance'

interface Props {
  relic: Relic
  onClose: () => void
}

const GPS_COLLECT_RADIUS = 150 // metres

export function RelicCard({ relic, onClose }: Props) {
  const { isCollected, collect, uncollect } = useCollection()
  const { position } = useLocation()
  const beginProcession = useGameStore(s => s.beginProcession)
  const processingRelicId = useGameStore(s => s.processingRelicId)
  const collected = isCollected(relic.id)

  const dist = position
    ? distanceMetres(position.lat, position.lng, relic.lat, relic.lng)
    : null

  const nearEnough = dist !== null && dist <= GPS_COLLECT_RADIUS
  const color = CATEGORY_COLORS[relic.category]

  function handleCollect() {
    if (collected) {
      uncollect(relic.id)
    } else {
      collect(relic.id)
    }
  }

  return (
    <div className="relic-card-overlay" onClick={onClose}>
      <div className="relic-card" onClick={(e) => e.stopPropagation()}>
        <button className="relic-card-close" onClick={onClose}>✕</button>

        <div className="relic-card-header" style={{ borderColor: color }}>
          <span className="relic-category-badge" style={{ background: color }}>
            {CATEGORY_LABELS[relic.category]}
          </span>
          {collected && <span className="relic-collected-badge">✦ Collected</span>}
        </div>

        <h2 className="relic-name">{relic.name}</h2>
        <p className="relic-name-local">{relic.nameLocal}</p>

        <div className="relic-church">
          <span className="relic-icon">⛪</span>
          <div>
            <div className="relic-church-name">{relic.church}</div>
            <div className="relic-address">{relic.address}</div>
          </div>
        </div>

        {dist !== null && (
          <div className="relic-distance" style={{ color: nearEnough ? '#4A6741' : '#8A7A5A' }}>
            {nearEnough ? '✦ You are here' : `${formatDistance(dist)} away`}
          </div>
        )}

        <p className="relic-description">{relic.description}</p>

        <div className="relic-fact">
          <span className="relic-fact-label">Did you know?</span>
          <p>{relic.interestingFact}</p>
        </div>

        {relic.year && (
          <div className="relic-year">Anno Domini: {relic.year}</div>
        )}

        <div className="relic-card-actions">
          {!collected ? (
            <>
              {nearEnough && (
                <button className="btn-collect btn-gps" onClick={handleCollect}>
                  ✦ Collect via GPS
                </button>
              )}
              <button
                className="btn-procession"
                disabled={processingRelicId !== null}
                onClick={() => {
                  beginProcession(relic.id)
                  onClose()
                }}
              >
                {processingRelicId !== null ? 'Procession in progress…' : '⚜ Begin Procession'}
              </button>
              <button className="btn-collect btn-manual" onClick={handleCollect}>
                collect manually
              </button>
            </>
          ) : (
            <button className="btn-uncollect" onClick={handleCollect}>
              Remove from collection
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
