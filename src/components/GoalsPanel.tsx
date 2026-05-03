import { GOALS } from '../data/goals'
import { useCollection } from '../hooks/useCollection'
import { MILAN_RELICS } from '../data/relics'
import { useGameStore } from '../store/useGameStore'

interface Props {
  onClose: () => void
}

export function GoalsPanel({ onClose }: Props) {
  const { collected, completedGoals, categoriesCollected } = useCollection()
  const holyEssence = useGameStore(s => s.holyEssence)
  const earnedTitleLatins = useGameStore(s => s.earnedTitleLatins)
  const allMilanIds = MILAN_RELICS.map(r => r.id)

  return (
    <div className="goals-panel-overlay" onClick={onClose}>
      <div className="goals-panel" onClick={e => e.stopPropagation()}>
        <button className="relic-card-close" onClick={onClose}>✕</button>
        <h2 className="goals-title">Pilgrim's Scroll</h2>
        <p className="goals-subtitle">
          {collected.length} of {MILAN_RELICS.length} Milano relics collected
        </p>

        {/* Holy Essence display */}
        <div className="goals-essence">
          <span className="goals-essence-icon">✦</span>
          <span className="goals-essence-value">{holyEssence.toLocaleString()}</span>
          <span className="goals-essence-label">Holy Essence</span>
        </div>

        {/* Earned titles */}
        {earnedTitleLatins.length > 0 && (
          <div className="goals-titles">
            {earnedTitleLatins.map(t => (
              <span key={t} className="goals-title-badge">{t}</span>
            ))}
          </div>
        )}

        <div className="goals-list">
          {GOALS.map(goal => {
            const done = completedGoals.includes(goal.id)
            const active = !done && goal.check(collected, allMilanIds, categoriesCollected)
            return (
              <div
                key={goal.id}
                className={`goal-item ${done ? 'goal-done' : ''} ${active ? 'goal-active' : ''}`}
              >
                <span className="goal-icon">{done ? '✦' : '○'}</span>
                <div>
                  <div className="goal-title">{goal.title}</div>
                  <div className="goal-desc">{goal.description}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
