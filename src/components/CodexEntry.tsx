import { useState } from 'react'
import {
  RELICS,
  MILAN_RELICS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  VENERATION_COLORS,
  RARITY_COLORS,
  type Relic,
} from '../data/relics'
import { useCollection } from '../hooks/useCollection'
import { getActiveFeastsForRelic } from '../data/liturgicalCalendar'
import { useLocation } from '../hooks/useLocation'
import { distanceMetres, formatDistance } from '../utils/distance'

interface Props {
  onClose: () => void
}

const DIGNITY_LABELS: Record<string, string> = {
  'Instrumenta Passionis': '⚜ Instrumenta Passionis',
  Primaria: 'Primaria (I Class)',
  Secundaria: 'Secundaria (II Class)',
  Tertiaria: 'Tertiaria (III Class)',
}

const DIGNITY_DESC: Record<string, string> = {
  'Instrumenta Passionis': 'Direct instruments of the Passion of Christ. Venerated with Latria — worship due to God alone, per Trent, Session XXV.',
  Primaria: 'First-class relics: actual bodily remains (exuviae corporis) of a saint. Most intimate and powerful pignora sancta.',
  Secundaria: 'Second-class relics: objects personally owned or used by the saint (instrumenta vitae). Venerated through contact.',
  Tertiaria: 'Third-class relics: objects touched to first- or second-class relics (brandea). Common, accessible pignora.',
}

function RelicSilhouette({ relic }: { relic: Relic }) {
  const color = CATEGORY_COLORS[relic.category]
  return (
    <div className="codex-silhouette">
      <div className="codex-silhouette-icon" style={{ color }}>
        <svg width="64" height="80" viewBox="0 0 32 40">
          <path
            d="M16 2 C8 2 3 8 3 15 C3 24 16 38 16 38 C16 38 29 24 29 15 C29 8 24 2 16 2Z"
            fill={color}
            opacity="0.15"
            stroke={color}
            strokeWidth="1"
            strokeDasharray="3,2"
          />
          <text x="16" y="19" textAnchor="middle" fontSize="10" fill={color} opacity="0.3">?</text>
        </svg>
      </div>
      <div className="codex-silhouette-hint">
        <em>Hic latet {relic.category === 'NAIL' ? 'Clavus' : relic.category === 'BONE' ? 'Os Sanctum' : 'Reliquia'}…</em>
      </div>
      <div className="codex-silhouette-city">
        {relic.city === 'rome' ? '🔒 Unlocks in Roma' : `${relic.church}`}
      </div>
    </div>
  )
}

function RelicDetail({ relic, onSelect }: { relic: Relic; onSelect: (r: Relic) => void }) {
  const { isCollected, collect } = useCollection()
  const { position } = useLocation()
  const collected = isCollected(relic.id)
  const catColor = CATEGORY_COLORS[relic.category]
  const venColor = VENERATION_COLORS[relic.veneration_type]
  const rarityColor = RARITY_COLORS[relic.rarity]
  const activeFeasts = getActiveFeastsForRelic(relic.provenance_sub, relic.liturgical_feast)
  const dist = position && relic.city === 'milano'
    ? distanceMetres(position.lat, position.lng, relic.lat, relic.lng)
    : null

  return (
    <div
      className={`codex-relic-card ${collected ? 'codex-relic-collected' : ''}`}
      style={{ borderLeftColor: catColor }}
      onClick={() => onSelect(relic)}
    >
      <div className="codex-relic-header">
        <span className="codex-relic-badge" style={{ background: catColor }}>
          {CATEGORY_LABELS[relic.category]}
        </span>
        <span className="codex-relic-rarity" style={{ color: rarityColor }}>
          {relic.rarity}
        </span>
        {collected && <span className="codex-relic-collected-mark">✦</span>}
      </div>
      <div className="codex-relic-name">{relic.nameLocal}</div>
      <div className="codex-relic-meta">
        <span style={{ color: venColor }}>● {relic.veneration_type}</span>
        <span> · {relic.points} pts</span>
        {dist !== null && <span> · {formatDistance(dist)}</span>}
      </div>
      {activeFeasts.length > 0 && (
        <div className="codex-feast-banner">
          ✶ {activeFeasts[0].latinName} — ×{activeFeasts[0].pointsMultiplier} bonus active
        </div>
      )}
      {!collected && relic.city === 'milano' && (
        <button
          className="codex-quick-collect"
          onClick={e => { e.stopPropagation(); collect(relic.id) }}
        >
          Mark Collected
        </button>
      )}
    </div>
  )
}

function FullRelicView({ relic, onBack }: { relic: Relic; onBack: () => void }) {
  const { isCollected, collect, uncollect } = useCollection()
  const collected = isCollected(relic.id)
  const catColor = CATEGORY_COLORS[relic.category]
  const venColor = VENERATION_COLORS[relic.veneration_type]
  const rarityColor = RARITY_COLORS[relic.rarity]
  const activeFeasts = getActiveFeastsForRelic(relic.provenance_sub, relic.liturgical_feast)

  // Count how many relics of same category exist
  const sameCat = RELICS.filter(r => r.category === relic.category)
  const sameProvenance = RELICS.filter(r => r.provenance_sub === relic.provenance_sub && r.id !== relic.id)

  return (
    <div className="codex-full-view">
      <button className="codex-back-btn" onClick={onBack}>← Codex</button>

      {/* Relic display */}
      <div className="codex-full-display" style={{ borderColor: venColor }}>
        <div className="codex-full-relic-icon" style={{ color: catColor }}>
          <svg width="80" height="100" viewBox="0 0 32 40">
            <path
              d="M16 2 C8 2 3 8 3 15 C3 24 16 38 16 38 C16 38 29 24 29 15 C29 8 24 2 16 2Z"
              fill={collected ? catColor : 'transparent'}
              stroke={catColor}
              strokeWidth="1.5"
              opacity={collected ? 0.9 : 0.4}
            />
            {collected && (
              <circle cx="16" cy="15" r="6" fill="rgba(255,240,200,0.9)" stroke={catColor} strokeWidth="1" />
            )}
            {collected && (
              <text x="16" y="19" textAnchor="middle" fontSize="8" fill={catColor}>✦</text>
            )}
          </svg>
        </div>
        {relic.incorruptio && (
          <div className="codex-incorruptio-badge">✶ Corpus Incorruptum</div>
        )}
        {activeFeasts.map(f => (
          <div key={f.id} className="codex-feast-banner">
            ✶ {f.latinName} — ×{f.pointsMultiplier} active
          </div>
        ))}
      </div>

      {/* Identity */}
      <div className="codex-full-identity">
        <h2 className="codex-full-name">{relic.nameLocal}</h2>
        <p className="codex-full-english">{relic.name}</p>
        <div className="codex-full-tags">
          <span className="codex-tag" style={{ background: catColor }}>{CATEGORY_LABELS[relic.category]}</span>
          <span className="codex-tag tag-rarity" style={{ color: rarityColor, borderColor: rarityColor }}>{relic.rarity}</span>
          <span className="codex-tag tag-veneration" style={{ color: venColor, borderColor: venColor }}>
            {relic.veneration_type}
          </span>
        </div>
      </div>

      {/* Three-Axis Classification */}
      <div className="codex-axes-section">
        <div className="codex-axis-title">Theologia Reliquiarum — Three Axes</div>
        <div className="codex-axis-row">
          <span className="codex-axis-label">I · Forma Materialis</span>
          <span className="codex-axis-value">{relic.material_class} — {relic.material_sub}</span>
        </div>
        <div className="codex-axis-row">
          <span className="codex-axis-label">II · Origo Sancta</span>
          <span className="codex-axis-value">{relic.provenance_class} — {relic.provenance_sub}</span>
        </div>
        <div className="codex-axis-row">
          <span className="codex-axis-label">III · Dignitas Theologica</span>
          <span className="codex-axis-value" style={{ color: venColor }}>
            {DIGNITY_LABELS[relic.theological_dignity] ?? relic.theological_dignity}
          </span>
        </div>
        {relic.body_part_group && (
          <div className="codex-axis-row">
            <span className="codex-axis-label">Pars Corporis</span>
            <span className="codex-axis-value">{relic.body_part_group}</span>
          </div>
        )}
        {relic.miraculous_attribute && (
          <div className="codex-axis-row">
            <span className="codex-axis-label">Attributum Miraculosum</span>
            <span className="codex-axis-value">{relic.miraculous_attribute}</span>
          </div>
        )}
        {relic.liturgical_feast && (
          <div className="codex-axis-row">
            <span className="codex-axis-label">Festum Liturgicum</span>
            <span className="codex-axis-value">{relic.liturgical_feast}</span>
          </div>
        )}
        <div className="codex-dignity-desc">
          <em>{DIGNITY_DESC[relic.theological_dignity]}</em>
        </div>
      </div>

      {/* Points & Location */}
      <div className="codex-full-stats">
        <div className="codex-stat">
          <span className="codex-stat-label">Points</span>
          <span className="codex-stat-value">{relic.points.toLocaleString()}</span>
        </div>
        <div className="codex-stat">
          <span className="codex-stat-label">Location</span>
          <span className="codex-stat-value">{relic.church}</span>
        </div>
        {relic.year && (
          <div className="codex-stat">
            <span className="codex-stat-label">Anno Domini</span>
            <span className="codex-stat-value">{relic.year}</span>
          </div>
        )}
      </div>

      {/* Set progress */}
      <div className="codex-set-progress">
        <div className="codex-set-label">
          {CATEGORY_LABELS[relic.category]} worldwide: {sameCat.length} known
        </div>
      </div>

      {/* Lore */}
      <div className="codex-lore-section">
        <div className="codex-lore-title">Lore</div>
        <p className="codex-lore-text">{relic.description}</p>
        <div className="codex-fact">
          <span className="codex-fact-label">Historical Record</span>
          <p>{relic.interestingFact}</p>
        </div>
      </div>

      {/* Related relics */}
      {sameProvenance.length > 0 && (
        <div className="codex-related">
          <div className="codex-related-title">Same Provenance: {relic.provenance_sub}</div>
          <div className="codex-related-list">
            {sameProvenance.slice(0, 3).map(r => (
              <span key={r.id} className="codex-related-chip">
                {r.nameLocal.split(' – ')[0]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="codex-full-actions">
        {relic.city === 'milano' && (
          collected ? (
            <button className="btn-uncollect" onClick={() => uncollect(relic.id)}>
              Remove from Collection
            </button>
          ) : (
            <button className="btn-collect btn-manual" onClick={() => collect(relic.id)}>
              ✦ Mark as Collected
            </button>
          )
        )}
        {relic.city === 'rome' && (
          <div className="codex-locked-notice">
            🔒 Unlock Roma to collect this relic
          </div>
        )}
      </div>
    </div>
  )
}

type FilterAxis = 'all' | 'city' | 'dignity' | 'veneration' | 'rarity'

export function CodexEntry({ onClose }: Props) {
  const { isCollected } = useCollection()
  const [selectedRelic, setSelectedRelic] = useState<Relic | null>(null)
  const [filter, setFilter] = useState<{ axis: FilterAxis; value: string }>({ axis: 'all', value: '' })
  const [showOnlyCollected, setShowOnlyCollected] = useState(false)

  const filteredRelics = RELICS.filter(r => {
    if (showOnlyCollected && !isCollected(r.id)) return false
    if (filter.axis === 'city') return r.city === filter.value
    if (filter.axis === 'dignity') return r.theological_dignity === filter.value
    if (filter.axis === 'veneration') return r.veneration_type === filter.value
    if (filter.axis === 'rarity') return r.rarity === filter.value
    return true
  })

  const milanCollected = MILAN_RELICS.filter(r => isCollected(r.id)).length
  const totalCollected = RELICS.filter(r => isCollected(r.id)).length

  if (selectedRelic) {
    return (
      <div className="codex-overlay">
        <div className="codex-panel">
          <FullRelicView relic={selectedRelic} onBack={() => setSelectedRelic(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="codex-overlay" onClick={onClose}>
      <div className="codex-panel" onClick={e => e.stopPropagation()}>
        <button className="relic-card-close" onClick={onClose}>✕</button>

        <div className="codex-header">
          <h2 className="codex-title">Reliquary Codex</h2>
          <p className="codex-subtitle">
            <em>Theologia Reliquiarum</em> — {totalCollected}/{RELICS.length} relics
          </p>
          <div className="codex-progress-bar-container">
            <div
              className="codex-progress-bar-fill"
              style={{ width: `${(milanCollected / MILAN_RELICS.length) * 100}%` }}
            />
          </div>
          <p className="codex-progress-label">{milanCollected}/{MILAN_RELICS.length} Milano · {RELICS.length - MILAN_RELICS.length} Rome locked</p>
        </div>

        {/* Filters */}
        <div className="codex-filters">
          <button
            className={`codex-filter-btn ${filter.axis === 'all' ? 'active' : ''}`}
            onClick={() => setFilter({ axis: 'all', value: '' })}
          >All</button>
          <button
            className={`codex-filter-btn ${filter.axis === 'city' && filter.value === 'milano' ? 'active' : ''}`}
            onClick={() => setFilter({ axis: 'city', value: 'milano' })}
          >Milano</button>
          <button
            className={`codex-filter-btn ${filter.axis === 'dignity' && filter.value === 'Instrumenta Passionis' ? 'active' : ''}`}
            onClick={() => setFilter({ axis: 'dignity', value: 'Instrumenta Passionis' })}
          >Passion</button>
          <button
            className={`codex-filter-btn ${filter.axis === 'dignity' && filter.value === 'Primaria' ? 'active' : ''}`}
            onClick={() => setFilter({ axis: 'dignity', value: 'Primaria' })}
          >Primaria</button>
          <button
            className={`codex-filter-btn ${filter.axis === 'veneration' && filter.value === 'Latria' ? 'active' : ''}`}
            onClick={() => setFilter({ axis: 'veneration', value: 'Latria' })}
          >Latria</button>
          <button
            className={`codex-filter-btn ${showOnlyCollected ? 'active' : ''}`}
            onClick={() => setShowOnlyCollected(v => !v)}
          >Collected</button>
        </div>

        {/* Relic list */}
        <div className="codex-list">
          {filteredRelics.map(relic =>
            isCollected(relic.id) || relic.city === 'milano' ? (
              <RelicDetail key={relic.id} relic={relic} onSelect={setSelectedRelic} />
            ) : (
              <RelicSilhouette key={relic.id} relic={relic} />
            ),
          )}
        </div>
      </div>
    </div>
  )
}

