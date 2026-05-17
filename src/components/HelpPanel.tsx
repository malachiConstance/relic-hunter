import { useState } from 'react'
import { GAME_DOC } from '../data/gameDocParser'
import type { TutorialStep } from '../data/gameDocParser'
import { useGameStore } from '../store/useGameStore'

interface Props {
  onClose: () => void
}

type Tab = 'tutorial' | 'concepts' | 'glossary'

function nl2p(text: string): React.ReactNode[] {
  return text.split('\n\n').filter(Boolean).map((para, i) => (
    <p key={i} className="help-para">{para.trim()}</p>
  ))
}

function TutorialStepCard({ step }: { step: TutorialStep }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="help-step-card">
      <button className="help-step-header" onClick={() => setOpen(o => !o)}>
        <span className="help-step-num">Step {step.num}</span>
        <span className="help-step-title">{step.title}</span>
        <span className="help-step-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="help-step-body">
          <div className="help-step-reward">✦ {step.reward}</div>
          <div className="help-step-objective"><strong>Objective:</strong> {step.objective}</div>
          {step.hint && (
            <div className="help-step-hint"><em>Hint: {step.hint}</em></div>
          )}
          <div className="help-step-howto-label">How to complete:</div>
          <div className="help-step-howto">
            {step.howto.split('\n').filter(Boolean).map((line, i) => (
              <div key={i} className="help-step-howto-line">{line.trim()}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function HelpPanel({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('tutorial')
  const [openArticle, setOpenArticle] = useState<string | null>(null)
  const [openTerm, setOpenTerm] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const resetGame = useGameStore(s => s.resetGame)

  const conceptsSection = GAME_DOC.sections.find(s => s.id === 'concepts')

  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-panel" onClick={e => e.stopPropagation()}>
        <button className="relic-card-close" onClick={onClose}>✕</button>

        <div className="help-header">
          <h2 className="help-title">Liber Peregrinantis</h2>
          <p className="help-subtitle"><em>The Pilgrim's Handbook</em></p>
        </div>

        {/* Tabs */}
        <div className="help-tabs">
          {(['tutorial', 'concepts', 'glossary'] as Tab[]).map(t => (
            <button
              key={t}
              className={`help-tab ${tab === t ? 'help-tab-active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'tutorial' ? 'Tutorial' : t === 'concepts' ? 'Concepts' : 'Glossary'}
            </button>
          ))}
        </div>

        <div className="help-content">

          {/* TUTORIAL TAB */}
          {tab === 'tutorial' && (
            <div>
              {GAME_DOC.tutorialIntro && (
                <p className="help-intro">{GAME_DOC.tutorialIntro}</p>
              )}
              {GAME_DOC.tutorialSteps.map(step => (
                <TutorialStepCard key={step.id} step={step} />
              ))}
              {GAME_DOC.tutorialCompletion && (
                <div className="help-completion">
                  <div className="help-completion-title">{GAME_DOC.tutorialCompletion.title}</div>
                  {nl2p(GAME_DOC.tutorialCompletion.body)}
                </div>
              )}
            </div>
          )}

          {/* CONCEPTS TAB */}
          {tab === 'concepts' && conceptsSection && (
            <div>
              {conceptsSection.articles.map(art => (
                <div key={art.id} className="help-article">
                  <button
                    className="help-article-header"
                    onClick={() => setOpenArticle(openArticle === art.id ? null : art.id)}
                  >
                    <span>{art.title}</span>
                    <span>{openArticle === art.id ? '▲' : '▼'}</span>
                  </button>
                  {openArticle === art.id && (
                    <div className="help-article-body">
                      {nl2p(art.body)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* GLOSSARY TAB */}
          {tab === 'glossary' && (
            <div>
              {GAME_DOC.glossary.map(term => (
                <div key={term.id} className="help-glossary-entry">
                  <button
                    className="help-glossary-word"
                    onClick={() => setOpenTerm(openTerm === term.id ? null : term.id)}
                  >
                    <span>{term.word}</span>
                    <span>{openTerm === term.id ? '▲' : '▼'}</span>
                  </button>
                  {openTerm !== term.id && (
                    <div className="help-glossary-short">{term.short}</div>
                  )}
                  {openTerm === term.id && (
                    <div className="help-glossary-full">{nl2p(term.full)}</div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>

        <div className="help-restart-zone">
          {!confirmReset ? (
            <button className="btn-restart-game" onClick={() => setConfirmReset(true)}>
              Restart Game
            </button>
          ) : (
            <div className="help-restart-confirm">
              <span className="restart-confirm-text">All progress will be lost. Are you sure?</span>
              <button
                className="btn-restart-confirm-yes"
                onClick={() => { resetGame(); onClose() }}
              >
                Yes, restart
              </button>
              <button className="btn-restart-confirm-no" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
