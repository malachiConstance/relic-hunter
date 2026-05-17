import { useState } from 'react'
import { useGameStore, MAX_FERVOR, MIN_FERVOR_AFTER_ROBBERY } from '../store/useGameStore'
import { getRestPlace } from '../data/restPlaces'
import { RELICS } from '../data/relics'

interface Props {
  placeId: string
  onClose: () => void
}

function haversineM(a: [number, number], b: [number, number]): number {
  const R = 6371000
  const dLat = (b[0] - a[0]) * Math.PI / 180
  const dLng = (b[1] - a[1]) * Math.PI / 180
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

const TYPE_ICONS: Record<string, string> = {
  kloster: '✝',
  church: '⛪',
  tavern: '⚱',
}

const TYPE_LABELS: Record<string, string> = {
  kloster: 'Monasterium',
  church: 'Ecclesia',
  tavern: 'Taberna',
}

const REST_VERB: Record<string, string> = {
  kloster: 'Ora et Labora — Rest and Pray',
  church: 'Rest and Pray',
  tavern: 'Enter and Drink',
}

export function RestPanel({ placeId, onClose }: Props) {
  const place = getRestPlace(placeId)
  const [rested, setRested] = useState(false)

  const fervor = useGameStore(s => s.fervor)
  const pilgrimLat = useGameStore(s => s.pilgrimLat)
  const pilgrimLng = useGameStore(s => s.pilgrimLng)
  const enterPlace = useGameStore(s => s.enterPlace)
  const pendingEncounter = useGameStore(s => s.pendingEncounter)
  const pendingRobbery = useGameStore(s => s.pendingRobbery)
  const dismissEncounter = useGameStore(s => s.dismissEncounter)
  const beginWalk = useGameStore(s => s.beginWalk)
  const walkingFervorCost = useGameStore(s => s.walkingFervorCost)
  const walkingToCoord = useGameStore(s => s.walkingToCoord)
  const knownRelicIds = useGameStore(s => s.knownRelicIds)
  const collected = useGameStore(s => s.collected)

  if (!place) return null

  const distanceM = haversineM([pilgrimLat, pilgrimLng], place.coord)
  const walkCost = walkingFervorCost([pilgrimLat, pilgrimLng], place.coord)
  const isNearby = distanceM <= 120  // within 120m = "at" the place
  const canAffordWalk = fervor >= walkCost

  function handleWalkHere() {
    beginWalk(place!.coord, placeId)
    onClose()
  }

  function handleRest() {
    enterPlace(placeId)
    setRested(true)
  }

  const icon = TYPE_ICONS[place.type] ?? '✝'
  const typeLabel = TYPE_LABELS[place.type] ?? 'Locus'
  const restVerb = REST_VERB[place.type] ?? 'Rest'

  // Newly revealed relic from this encounter
  const newRelicId = pendingEncounter?.reveal?.relicId
  const newRelic = newRelicId ? RELICS.find(r => r.id === newRelicId) : null
  const newPlaceId = pendingEncounter?.reveal?.placeId
  const newPlace = newPlaceId ? getRestPlace(newPlaceId) : null
  const isFalseLeadReveal = pendingEncounter?.reveal?.isFalseLead

  return (
    <div className="rest-panel-overlay" onClick={onClose}>
      <div className="rest-panel" onClick={e => e.stopPropagation()}>
        <button className="relic-card-close" onClick={onClose}>✕</button>

        {/* Place header */}
        <div className="rest-panel-header">
          <span className="rest-panel-type-badge">{icon} {typeLabel}</span>
          <h2 className="rest-panel-name">{place.name}</h2>
          <div className="rest-panel-latin">{place.nameLocal}</div>
        </div>

        {pendingRobbery ? (
          /* Robbery outcome — false lead or random robbery at real place */
          <div className="rest-panel-robbery">
            <div className="rest-panel-robbery-icon">⚔</div>
            <div className="rest-panel-robbery-title">{pendingRobbery.title}</div>
            <p className="rest-panel-robbery-text">{pendingRobbery.narrative}</p>
            <div className="rest-panel-robbery-rescue">
              <span className="rest-panel-robbery-rescue-icon">✦</span>
              {pendingRobbery.rescue}
            </div>
            <div className="rest-panel-robbery-cost">
              You are left with {MIN_FERVOR_AFTER_ROBBERY} Fervor — barely enough to walk.
              {pendingRobbery.lossType !== 'fervor' && (
                <span> You have also lost {pendingRobbery.essenceLoss ?? 30} Holy Essence.</span>
              )}
            </div>
            <button className="rest-panel-btn" onClick={() => { dismissEncounter(); onClose() }}>Leave this place</button>
          </div>
        ) : !rested ? (
          <>
            {/* Description & history */}
            <p className="rest-panel-desc">{place.description}</p>
            <div className="rest-panel-history">
              <span className="rest-panel-history-label">Historia</span>
              <p>{place.history}</p>
            </div>

            {/* Fervor bar */}
            <div className="rest-panel-fervor-section">
              <div className="rest-panel-fervor-label">
                Fervor Spiritalis
              </div>
              <div className="rest-panel-fervor-track">
                <div
                  className="rest-panel-fervor-fill"
                  style={{ width: `${(fervor / MAX_FERVOR) * 100}%` }}
                />
              </div>
              <div className="rest-panel-fervor-nums">
                <span>{fervor}</span>
                <span style={{ opacity: 0.5 }}>/</span>
                <span style={{ opacity: 0.6 }}>{MAX_FERVOR}</span>
              </div>
            </div>

            {/* Walk there vs rest here */}
            {!isNearby ? (
              <>
                <div className="rest-panel-distance">
                  {Math.round(distanceM)}m away — you must walk there first
                </div>
                <button
                  className="rest-panel-btn rest-panel-btn-primary"
                  onClick={handleWalkHere}
                  disabled={!canAffordWalk || !!walkingToCoord}
                >
                  ⚑ Walk there
                  <span className="rest-panel-btn-reward">−{walkCost} Fervor</span>
                </button>
                {!canAffordWalk && (
                  <div className="rest-panel-warning">
                    Insufficient Fervor for this journey. Rest somewhere nearby first.
                  </div>
                )}
              </>
            ) : (
              <>
                <button
                  className="rest-panel-btn rest-panel-btn-primary"
                  onClick={handleRest}
                >
                  {place.isFalseLead ? 'Investigate' : restVerb}
                  {!place.isFalseLead && (
                    <span className="rest-panel-btn-reward">+{place.fervorRestore} Fervor</span>
                  )}
                </button>
              </>
            )}
          </>
        ) : (
          /* Post-rest state: show encounter */
          <div className="rest-panel-rested">
            <div className="rest-panel-rested-banner">
              {place.type === 'tavern' ? '⚱ You enter, drink, and listen.' : '✝ You kneel, pray, and rest your spirit.'}
            </div>
            <div className="rest-panel-fervor-restored">
              +{place.fervorRestore} Fervor Spiritalis restored
            </div>

            {pendingEncounter && (
              <div className="rest-panel-encounter">
                <div className="rest-panel-encounter-pilgrim">
                  <span className="rest-panel-pilgrim-name">{pendingEncounter.pilgrimName}</span>
                  <span className="rest-panel-pilgrim-from">{pendingEncounter.from}</span>
                </div>
                <blockquote className="rest-panel-encounter-dialogue">
                  "{pendingEncounter.dialogue}"
                </blockquote>

                {/* Reveal result */}
                {newRelic && !isFalseLeadReveal && (
                  <div className="rest-panel-reveal">
                    <span className="rest-panel-reveal-icon">✦</span>
                    <span>
                      <em>{newRelic.name}</em> has been added to your pilgrim's map.
                    </span>
                  </div>
                )}
                {newPlace && !isFalseLeadReveal && (
                  <div className="rest-panel-reveal">
                    <span className="rest-panel-reveal-icon">✦</span>
                    <span>
                      <em>{newPlace.name}</em> now appears on your map.
                    </span>
                  </div>
                )}
                {isFalseLeadReveal && newPlace && (
                  <div className="rest-panel-reveal rest-panel-reveal-suspect">
                    <span className="rest-panel-reveal-icon">⚠</span>
                    <span>
                      A rumoured location near <em>{newPlace.name}</em> has been marked — proceed with caution.
                    </span>
                  </div>
                )}
                {pendingEncounter.type === 'neutral' && (
                  <div className="rest-panel-reveal rest-panel-reveal-neutral">
                    <span className="rest-panel-reveal-icon">—</span>
                    <span>No new information gained. The pilgrim road teaches patience.</span>
                  </div>
                )}
              </div>
            )}

            <button
              className="rest-panel-btn rest-panel-btn-primary"
              onClick={() => { dismissEncounter(); onClose() }}
            >
              Continue your pilgrimage
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
