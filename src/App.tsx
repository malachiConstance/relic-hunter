import { useState, useEffect, useRef } from 'react'
import { Map } from './components/Map'
import { RelicCard } from './components/RelicCard'
import { RelicTeaserOverlay } from './components/RelicTeaserOverlay'
import { ArrivalCeremony } from './components/ArrivalCeremony'
import { VisionToast } from './components/VisionToast'
import { RomaVocat } from './components/RomaVocat'
import { HelpPanel } from './components/HelpPanel'
import { GlossaryTooltip } from './components/GlossaryTooltip'
import { GoalsPanel } from './components/GoalsPanel'
import { CodexEntry } from './components/CodexEntry'
import { QuestBoard } from './components/QuestBoard'
import { ReliquaryChapel } from './components/ReliquaryChapel'
import { RestPanel } from './components/RestPanel'
import { IntroScreen } from './components/IntroScreen'
import { useCollection } from './hooks/useCollection'
import { useGameStore, MAX_FERVOR } from './store/useGameStore'
import { cellsRevealedAt, FOG_REVEAL_RING_SPAWN } from './engine/fogOfWar'
import { MILAN_RELICS, RELICS, type Relic } from './data/relics'
import { REST_PLACES } from './data/restPlaces'
import { getActiveFeastToday } from './data/liturgicalCalendar'
import './App.css'

type Screen = 'map' | 'codex' | 'quests' | 'chapel'

const ALL_PLACE_IDS = ['castello-sforzesco', 'san-maurizio', 'san-marco', 'san-pietro-gessate', 'san-calimero', 'locanda-falcone', 'osteria-pellegrini', 'bettolino-vetra']

export default function App() {
  const [screen, setScreen] = useState<Screen>('map')
  const [selectedRelic, setSelectedRelic] = useState<Relic | null>(null)
  const [showGoals, setShowGoals] = useState(false)
  const [restPlaceId, setRestPlaceId] = useState<string | null>(null)
  const visitedPlaceIds = useGameStore(s => s.visitedPlaceIds)
  const [showIntro, setShowIntro] = useState(() => {
    const s = useGameStore.getState()
    return s.tutorialStep <= 1 && s.collected.length === 0 && s.visitedPlaceIds.length === 0
  })
  const { collected } = useCollection()
  const holyEssence = useGameStore(s => s.holyEssence)
  const fervor = useGameStore(s => s.fervor)
  const pilgrimLat = useGameStore(s => s.pilgrimLat)
  const pilgrimLng = useGameStore(s => s.pilgrimLng)
  const walkingToCoord = useGameStore(s => s.walkingToCoord)
  const walkingDestPlaceId = useGameStore(s => s.walkingDestPlaceId)
  const knownPlaceIds = useGameStore(s => s.knownPlaceIds)
  const beginWalk = useGameStore(s => s.beginWalk)
  const walkingFervorCost = useGameStore(s => s.walkingFervorCost)
  const activeQuests = useGameStore(s => s.activeQuests)
  const activeFeast = getActiveFeastToday()

  const teaserRelicId = useGameStore(s => s.teaserRelicId)
  const ceremonyRelicId = useGameStore(s => s.ceremonyRelicId)
  const tutorialStep = useGameStore(s => s.tutorialStep)
  const romeUnlocked = useGameStore(s => s.romeUnlocked)
  const setTeaserRelic = useGameStore(s => s.setTeaserRelic)
  const [showRomaVocat, setShowRomaVocat] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const prevRomeUnlocked = useRef(romeUnlocked)

  // Trigger Roma Vocat cinematic once when romeUnlocked transitions false → true
  useEffect(() => {
    if (romeUnlocked && !prevRomeUnlocked.current) setShowRomaVocat(true)
    prevRomeUnlocked.current = romeUnlocked
  }, [romeUnlocked])

  // After a walk completes to a place, auto-open the rest panel
  const prevWalkingDestPlaceId = useRef<string | null>(null)
  useEffect(() => {
    const prev = prevWalkingDestPlaceId.current
    prevWalkingDestPlaceId.current = walkingDestPlaceId
    if (prev !== null && walkingDestPlaceId === null) {
      setTeaserRelic(null)
      setRestPlaceId(prev)
    }
  }, [walkingDestPlaceId])

  // On first load: initialise tutorial step and migrate discovery system for existing players.
  useEffect(() => {
    const state = useGameStore.getState()
    const hasProgress = state.collected.length > 0
    // Migrate any player who has collected relics but hasn't had the discovery system initialised
    // (knownRelicIds still at its seed of 1 entry means they're a pre-discovery-system save).
    const needsDiscoveryMigration = hasProgress && state.knownRelicIds.length <= 1
    // Always seed the spawn reveal if exploredCells is empty (new game or reset)
    if (state.exploredCells.length === 0) {
      useGameStore.getState().revealCells(
        cellsRevealedAt(state.pilgrimLat, state.pilgrimLng, FOG_REVEAL_RING_SPAWN)
      )
    }
    if (state.tutorialStep === 0) {
      if (hasProgress) {
        useGameStore.setState({
          tutorialStep: 6,
          knownRelicIds: MILAN_RELICS.map(r => r.id),
          knownPlaceIds: ALL_PLACE_IDS,
          fervor: 80,
        })
      } else {
        useGameStore.setState({ tutorialStep: 1 })
      }
    } else if (needsDiscoveryMigration) {
      useGameStore.setState({
        knownRelicIds: MILAN_RELICS.map(r => r.id),
        knownPlaceIds: ALL_PLACE_IDS,
        fervor: Math.max(state.fervor, 60),
      })
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const pendingQuestCount = activeQuests.filter(
    q => !q.isCompleted && q.progressPercent > 0,
  ).length
  const completableCount = activeQuests.filter(q => q.isCompleted).length

  // Find the nearest known rest place within 120m (show "rest here" button)
  function haversineM(a: [number, number], b: [number, number]): number {
    const R = 6371000
    const dLat = (b[0] - a[0]) * Math.PI / 180
    const dLng = (b[1] - a[1]) * Math.PI / 180
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
  }
  const nearbyPlace = REST_PLACES.find(p =>
    !p.isFalseLead &&
    knownPlaceIds.includes(p.id) &&
    haversineM([pilgrimLat, pilgrimLng], p.coord) <= 120,
  )

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">⚜ I Predatori delle Reliquie Sacre</h1>
          <span className="app-city">
            {screen === 'map' ? 'Milano, Italia' : screen === 'codex' ? 'Reliquary Codex' : screen === 'quests' ? 'Quest Board' : 'Chapel'}
          </span>
        </div>
        <div className="header-right">
          <span className="header-fervor" title="Fervor Spiritalis — spiritual energy">
            <span className="fervor-icon">♦</span>
            <span className="fervor-value">{fervor}</span>
            <div className="fervor-bar-mini">
              <div className="fervor-bar-fill-mini" style={{ width: `${(fervor / MAX_FERVOR) * 100}%` }} />
            </div>
          </span>
          <span className="header-essence">
            <GlossaryTooltip termId="holy-essence">
              <span className="essence-icon">✦</span>
              {holyEssence.toLocaleString()}
            </GlossaryTooltip>
          </span>
          <span className="collection-count">
            {collected.filter(id => MILAN_RELICS.some(r => r.id === id)).length}/{MILAN_RELICS.length}
          </span>
          <button className="btn-help" onClick={() => setShowHelp(true)}>?</button>
          {screen === 'map' && (
            <button className="btn-scroll" onClick={() => setShowGoals(true)}>
              Scroll
            </button>
          )}
        </div>
      </header>

      {/* Active feast banner */}
      {activeFeast && screen === 'map' && (
        <div className="feast-banner">
          ✶ <em>{activeFeast.latinName}</em> — {activeFeast.flavorText}
        </div>
      )}

      {/* Main content area */}
      <div className="screen-container">

        {/* MAP SCREEN */}
        {screen === 'map' && (
          <div className="map-container">
            <Map
              onRelicClick={relic => { setRestPlaceId(null); setTeaserRelic(relic.id) }}
              onPlaceClick={placeId => { setTeaserRelic(null); setRestPlaceId(placeId) }}
            />

            <div className="map-legend">
              <div className="legend-title">Categories</div>
              {[
                { label: 'Nail of the Cross', color: '#8B1A1A' },
                { label: 'True Cross', color: '#5C3A1E' },
                { label: 'Three Kings', color: '#C9A84C' },
                { label: "Saint's Body", color: '#6B4C8A' },
                { label: "Saint's Bones", color: '#8A7A5A' },
                { label: 'Holy Vestments', color: '#2A5C8A' },
                { label: 'Instrument', color: '#5A5A5A' },
              ].map(({ label, color }) => (
                <div key={label} className="legend-item">
                  <span className="legend-dot" style={{ background: color }} />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Contextual "Rest here" button — hidden when any modal is open */}
            {nearbyPlace && !walkingToCoord && !restPlaceId && !teaserRelicId && !ceremonyRelicId && screen === 'map' && (
              <button
                className="map-rest-here-btn"
                onClick={() => setRestPlaceId(nearbyPlace.id)}
              >
                <span className="map-rest-here-icon">
                  {nearbyPlace.type === 'tavern' ? '⚱' : nearbyPlace.type === 'kloster' ? '✝' : '⛪'}
                </span>
                <span className="map-rest-here-text">
                  {nearbyPlace.type === 'tavern' ? 'Enter tavern' : 'Rest here'}
                  <em>{nearbyPlace.name}</em>
                </span>
              </button>
            )}

            {/* Quest progress indicator on map */}
            {(pendingQuestCount > 0 || completableCount > 0) && (
              <div
                className="map-quest-indicator"
                onClick={() => setScreen('quests')}
              >
                {completableCount > 0 ? (
                  <span className="quest-ready">✦ {completableCount} quest{completableCount > 1 ? 's' : ''} ready to claim!</span>
                ) : (
                  <span>{pendingQuestCount} quest{pendingQuestCount > 1 ? 's' : ''} in progress</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* CODEX SCREEN */}
        {screen === 'codex' && (
          <div className="fullscreen-panel">
            <CodexEntry onClose={() => setScreen('map')} />
          </div>
        )}

        {/* QUEST BOARD SCREEN */}
        {screen === 'quests' && (
          <div className="fullscreen-panel">
            <QuestBoard onClose={() => setScreen('map')} onNavigateToMap={() => setScreen('map')} />
          </div>
        )}

        {/* CHAPEL SCREEN */}
        {screen === 'chapel' && (
          <div className="fullscreen-panel">
            <ReliquaryChapel onClose={() => setScreen('map')} />
          </div>
        )}
      </div>

      {/* Teaser overlay (tap on ring → teaser first) */}
      {teaserRelicId && !ceremonyRelicId && (
        <RelicTeaserOverlay
          relicId={teaserRelicId}
          onClose={() => setTeaserRelic(null)}
          onViewFull={() => {
            const r = RELICS.find(rel => rel.id === teaserRelicId)
            if (r) setSelectedRelic(r)
            setTeaserRelic(null)
          }}
        />
      )}

      {/* Arrival ceremony overlay */}
      {ceremonyRelicId && (
        <ArrivalCeremony
          relicId={ceremonyRelicId}
          onNavigateToChapel={() => setScreen('chapel')}
          onCancel={() => useGameStore.getState().cancelCeremony()}
        />
      )}

      {/* Relic detail card (overlay — accessed via teaser "View full record") */}
      {selectedRelic && !teaserRelicId && !ceremonyRelicId && (
        <RelicCard relic={selectedRelic} onClose={() => setSelectedRelic(null)} />
      )}

      {/* Arrival intro screen (new game only) */}
      {showIntro && !restPlaceId && (
        <IntroScreen
          onRest={() => { setShowIntro(false); setRestPlaceId('castello-sforzesco') }}
          onExplore={() => setShowIntro(false)}
        />
      )}

      {/* Rest place panel */}
      {restPlaceId && !ceremonyRelicId && !teaserRelicId && (
        <RestPanel placeId={restPlaceId} onClose={() => setRestPlaceId(null)} />
      )}

      {/* Vision toast (during procession) */}
      <VisionToast />

      {/* Roma Vocat — one-time cinematic when all Milan relics collected */}
      {showRomaVocat && <RomaVocat onDismiss={() => setShowRomaVocat(false)} />}

      {/* Help panel */}
      {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}

      {/* Goals panel (overlay) */}
      {showGoals && (
        <GoalsPanel onClose={() => setShowGoals(false)} />
      )}

      {/* Bottom navigation */}
      <nav className="bottom-nav">
        <button
          className={`nav-btn ${screen === 'map' ? 'nav-active' : ''}`}
          onClick={() => { setScreen('map'); setSelectedRelic(null) }}
        >
          <span className="nav-icon">🗺</span>
          <span className="nav-label">Map</span>
        </button>
        <button
          className={`nav-btn ${screen === 'codex' ? 'nav-active' : ''}`}
          onClick={() => setScreen('codex')}
        >
          <span className="nav-icon">📜</span>
          <span className="nav-label">Codex</span>
        </button>
        <button
          className={`nav-btn ${screen === 'quests' ? 'nav-active' : ''} ${completableCount > 0 ? 'nav-pulse' : ''}`}
          onClick={() => setScreen('quests')}
        >
          <span className="nav-icon">⚔</span>
          <span className="nav-label">Quests</span>
          {completableCount > 0 && <span className="nav-badge">{completableCount}</span>}
        </button>
        <button
          className={`nav-btn ${screen === 'chapel' ? 'nav-active' : ''}`}
          onClick={() => setScreen('chapel')}
        >
          <span className="nav-icon">⛪</span>
          <span className="nav-label">Chapel</span>
        </button>
      </nav>
    </div>
  )
}
