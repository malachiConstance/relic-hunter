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
import { useCollection } from './hooks/useCollection'
import { useGameStore } from './store/useGameStore'
import { MILAN_RELICS, RELICS, type Relic } from './data/relics'
import { getActiveFeastToday } from './data/liturgicalCalendar'
import './App.css'

type Screen = 'map' | 'codex' | 'quests' | 'chapel'

export default function App() {
  const [screen, setScreen] = useState<Screen>('map')
  const [selectedRelic, setSelectedRelic] = useState<Relic | null>(null)
  const [showGoals, setShowGoals] = useState(false)
  const { collected } = useCollection()
  const holyEssence = useGameStore(s => s.holyEssence)
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

  // On first load: if player has collected relics but tutorial isn't started, skip tutorial
  useEffect(() => {
    if (tutorialStep === 0) {
      const storeCollected = useGameStore.getState().collected
      useGameStore.setState({ tutorialStep: storeCollected.length > 0 ? 6 : 1 })
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const pendingQuestCount = activeQuests.filter(
    q => !q.isCompleted && q.progressPercent > 0,
  ).length
  const completableCount = activeQuests.filter(q => q.isCompleted).length

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">⚜ Relic Hunter</h1>
          <span className="app-city">
            {screen === 'map' ? 'Milano, Italia' : screen === 'codex' ? 'Reliquary Codex' : screen === 'quests' ? 'Quest Board' : 'Chapel'}
          </span>
        </div>
        <div className="header-right">
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
            <Map onRelicClick={relic => setTeaserRelic(relic.id)} />

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
        />
      )}

      {/* Relic detail card (overlay — accessed via teaser "View full record") */}
      {selectedRelic && !teaserRelicId && !ceremonyRelicId && (
        <RelicCard relic={selectedRelic} onClose={() => setSelectedRelic(null)} />
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
