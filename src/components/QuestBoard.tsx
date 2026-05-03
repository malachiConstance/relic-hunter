import { useGameStore } from '../store/useGameStore'
import { getActiveFeastToday } from '../data/liturgicalCalendar'
import { TUTORIAL_QUESTS } from '../data/tutorialQuests'
import { MILAN_RELICS } from '../data/relics'
import type { Quest } from '../engine/QuestGenerator'
import type { TutorialQuest } from '../data/tutorialQuests'

interface Props {
  onClose: () => void
  onNavigateToMap: () => void
}

const QUEST_TYPE_LABELS: Record<string, string> = {
  CATEGORY_SWEEP: 'Collectio',
  SAINT_REASSEMBLY: 'Reconstitutio',
  THEOLOGICAL_SET: 'Pignora',
  INSTRUMENTA_PASSIONIS: 'Instrumenta',
  LOCAL_PATRON: 'Patrocinium',
}

const QUEST_TYPE_ICONS: Record<string, string> = {
  CATEGORY_SWEEP: '⊕',
  SAINT_REASSEMBLY: '✤',
  THEOLOGICAL_SET: '⚜',
  INSTRUMENTA_PASSIONIS: '✝',
  LOCAL_PATRON: '⛪',
}

function haversineM(a: [number, number], b: [number, number]): number {
  const R = 6371000
  const dLat = (b[0] - a[0]) * Math.PI / 180
  const dLng = (b[1] - a[1]) * Math.PI / 180
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

function TutorialQuestCard({ quest, isActive, isDone, onWalk }: { quest: TutorialQuest; isActive: boolean; isDone: boolean; onWalk?: () => void }) {
  return (
    <div className={`quest-card tutorial-quest-card ${isDone ? 'tutorial-quest-done' : ''} ${isActive ? 'tutorial-quest-active' : ''}`}>
      <div className="quest-card-header">
        <span className="quest-type-badge">✦ Peregrinatio — Step {quest.step}</span>
        {isDone && <span className="tutorial-done-badge">✓ Completum</span>}
      </div>
      <div className="quest-latin-name">{quest.name}</div>
      <p className="quest-description">{quest.description}</p>
      <div className="quest-objective">
        <span className="quest-objective-label">Objective</span>
        <span>{quest.objective}</span>
      </div>
      {quest.hint && isActive && (
        <div className="quest-hint"><em>✦ {quest.hint}</em></div>
      )}
      {isActive && onWalk && (
        <button className="quest-walk-btn" onClick={onWalk}>→ Walk to objective</button>
      )}
      <div className="quest-rewards">
        <div className="quest-rewards-label">Reward</div>
        <div className="quest-rewards-body">
          <span className="quest-reward-essence">+{quest.reward.holyEssence} Holy Essence</span>
          <span className="quest-reward-title">Title: <em>{quest.reward.title}</em></span>
        </div>
      </div>
    </div>
  )
}

function QuestCard({ quest, onClaim, onWalk }: { quest: Quest; onClaim: (id: string) => void; onWalk?: () => void }) {
  const isComplete = quest.isCompleted
  const progressColor = quest.progressPercent > 66
    ? '#4A6741'
    : quest.progressPercent > 33
    ? '#C9A84C'
    : '#8B1A1A'

  return (
    <div className={`quest-card ${isComplete ? 'quest-complete' : ''}`}>
      <div className="quest-card-header">
        <span className="quest-type-badge">
          {QUEST_TYPE_ICONS[quest.type]} {QUEST_TYPE_LABELS[quest.type]}
        </span>
        {quest.liturgicalBonus > 1 && (
          <span className="quest-feast-bonus">✶ ×{quest.liturgicalBonus.toFixed(1)} feast bonus</span>
        )}
      </div>

      <div className="quest-latin-name">{quest.latinName}</div>
      <div className="quest-name">{quest.name}</div>

      <p className="quest-description">{quest.description}</p>

      <div className="quest-objective">
        <span className="quest-objective-label">Objective</span>
        <span>{quest.objective}</span>
      </div>

      {quest.hasIncorruptio && (
        <div className="quest-incorruptio">✶ Incorruptio miracle upon completion</div>
      )}

      {/* Progress */}
      <div className="quest-progress">
        <div className="quest-progress-label">
          {quest.currentCount} / {quest.requiredCount}
          {quest.type === 'SAINT_REASSEMBLY' ? ' body groups' : ' relics'}
        </div>
        <div className="quest-progress-track">
          <div
            className="quest-progress-fill"
            style={{ width: `${quest.progressPercent}%`, background: progressColor }}
          />
        </div>
        <div className="quest-progress-pct">{quest.progressPercent}%</div>
      </div>

      {/* Rewards */}
      <div className="quest-rewards">
        <div className="quest-rewards-label">Rewards</div>
        <div className="quest-rewards-body">
          <span className="quest-reward-essence">+{quest.rewards.holyEssence.toLocaleString()} Holy Essence</span>
          <span className="quest-reward-title">
            Title: <em>{quest.rewards.titleLatin}</em>
          </span>
          {quest.rewards.buff && (
            <span className="quest-reward-buff">
              Buff: {quest.rewards.buff.latinName} — {quest.rewards.buff.effect}
            </span>
          )}
        </div>
      </div>

      {!isComplete && onWalk && quest.targetRelicIds.length > 0 && (
        <button className="quest-walk-btn" onClick={onWalk}>→ Walk to objective</button>
      )}
      {isComplete && (
        <button className="quest-claim-btn" onClick={() => onClaim(quest.id)}>
          ✦ Claim Reward — Deo Gratias!
        </button>
      )}
    </div>
  )
}

export function QuestBoard({ onClose, onNavigateToMap }: Props) {
  const { activeQuests, completedQuestIds, refreshQuests, claimCompletedQuest, lastQuestRefresh } = useGameStore()
  const tutorialStep = useGameStore(s => s.tutorialStep)
  const collected = useGameStore(s => s.collected)
  const pilgrimLat = useGameStore(s => s.pilgrimLat)
  const pilgrimLng = useGameStore(s => s.pilgrimLng)
  const beginProcession = useGameStore(s => s.beginProcession)
  const activeFeast = getActiveFeastToday()

  function walkToNearest(relicIds: string[]) {
    const uncollected = relicIds.filter(id => !collected.includes(id))
    if (uncollected.length === 0) return
    const nearest = uncollected.reduce((best, id) => {
      const r = MILAN_RELICS.find(r => r.id === id)
      if (!r) return best
      const d = haversineM([pilgrimLat, pilgrimLng], [r.lat, r.lng])
      return (!best || d < best.d) ? { id, d } : best
    }, null as { id: string; d: number } | null)
    if (nearest) {
      beginProcession(nearest.id)
      onNavigateToMap()
      onClose()
    }
  }

  const pendingQuests = activeQuests.filter(q => !completedQuestIds.includes(q.id))

  const activeTutorialQuest = tutorialStep >= 1 && tutorialStep <= 5
    ? TUTORIAL_QUESTS.find(q => q.step === tutorialStep) ?? null
    : null
  const doneTutorialQuests = TUTORIAL_QUESTS.filter(q => q.step < tutorialStep)

  const hoursSinceRefresh = lastQuestRefresh
    ? Math.floor((Date.now() - lastQuestRefresh) / (1000 * 60 * 60))
    : null

  return (
    <div className="quest-overlay" onClick={onClose}>
      <div className="quest-panel" onClick={e => e.stopPropagation()}>
        <button className="relic-card-close" onClick={onClose}>✕</button>

        <div className="quest-header">
          <h2 className="quest-title">Papal Quest Board</h2>
          <p className="quest-subtitle">
            <em>Tabularium Sacrum Quaestionum</em>
          </p>
        </div>

        {/* Active feast banner */}
        {activeFeast && (
          <div className="quest-feast-banner">
            <div className="quest-feast-icon">✶</div>
            <div>
              <div className="quest-feast-name">{activeFeast.latinName}</div>
              <div className="quest-feast-text">{activeFeast.flavorText}</div>
              <div className="quest-feast-bonus-text">
                ×{activeFeast.pointsMultiplier} points · +{activeFeast.essenceBonus} Holy Essence on related quests
              </div>
            </div>
          </div>
        )}

        {/* Active tutorial quest */}
        {activeTutorialQuest && (
          <div className="quest-section">
            <div className="quest-section-label">Pilgrim's Journey</div>
            <TutorialQuestCard
              quest={activeTutorialQuest}
              isActive
              isDone={false}
              onWalk={activeTutorialQuest.targetRelicIds ? () => walkToNearest(activeTutorialQuest.targetRelicIds!) : undefined}
            />
          </div>
        )}

        {/* Dynamic quests */}
        {pendingQuests.length > 0 && (
          <div className="quest-section">
            {activeTutorialQuest && <div className="quest-section-label">Other Quests</div>}
            <div className="quest-list">
              {pendingQuests.map(quest => (
                <QuestCard
                key={quest.id}
                quest={quest}
                onClaim={claimCompletedQuest}
                onWalk={quest.targetRelicIds.length > 0 ? () => walkToNearest(quest.targetRelicIds) : undefined}
              />
              ))}
            </div>
          </div>
        )}

        {pendingQuests.length === 0 && !activeTutorialQuest && (
          <div className="quest-empty">
            <p>No active quests. Refresh to generate new <em>Mandata Sacra</em>.</p>
          </div>
        )}

        {/* Completed tutorial quests at bottom */}
        {doneTutorialQuests.length > 0 && (
          <div className="quest-section">
            <div className="quest-section-label">Completed</div>
            {doneTutorialQuests.map(q => (
              <TutorialQuestCard key={q.id} quest={q} isActive={false} isDone={true} />
            ))}
          </div>
        )}

        {/* Refresh */}
        <div className="quest-footer">
          {hoursSinceRefresh !== null && (
            <span className="quest-refresh-info">
              Last refresh: {hoursSinceRefresh}h ago
            </span>
          )}
          <button className="quest-refresh-btn" onClick={refreshQuests}>
            ⟳ New Quests
          </button>
        </div>
      </div>
    </div>
  )
}
