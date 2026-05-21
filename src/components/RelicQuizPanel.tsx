import { useState } from 'react'
import { getQuizForRelic, shuffleQuestions, type QuizQuestion } from '../data/relicQuizzes'

interface Props {
  relicId: string
  onPass: () => void      // ≥2/3 correct
  onFail: () => void      // <2/3 correct
}

type AnswerState = 'unanswered' | 'correct' | 'wrong'

export function RelicQuizPanel({ relicId, onPass, onFail }: Props) {
  const quiz = getQuizForRelic(relicId)
  const [questions] = useState<QuizQuestion[]>(() => quiz ? shuffleQuestions(quiz) : [])
  const [answers, setAnswers] = useState<AnswerState[]>(['unanswered', 'unanswered', 'unanswered'])
  const [current, setCurrent] = useState(0)
  const [revealed, setRevealed] = useState(false)

  if (!quiz || questions.length === 0) {
    onPass()
    return null
  }

  const q = questions[current]
  const allAnswered = current >= questions.length
  const correctCount = answers.filter(a => a === 'correct').length

  function handleAnswer(idx: number) {
    if (answers[current] !== 'unanswered') return
    const isCorrect = idx === q.correctIndex
    const newAnswers = [...answers]
    newAnswers[current] = isCorrect ? 'correct' : 'wrong'
    setAnswers(newAnswers)
    setRevealed(true)
  }

  function handleOK() {
    const newAnswers = answers
    setRevealed(false)
    if (current + 1 >= questions.length) {
      const finalCorrect = newAnswers.filter(a => a === 'correct').length
      if (finalCorrect >= 2) onPass()
      else onFail()
    } else {
      setCurrent(c => c + 1)
    }
  }

  const progressDots = answers.map((a, i) => {
    const color = i < current
      ? (a === 'correct' ? '#4A6741' : '#8B1A1A')
      : i === current ? '#C9A84C'
      : '#555'
    return (
      <span key={i} style={{
        display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
        background: color, margin: '0 4px',
      }} />
    )
  })

  return (
    <div className="quiz-panel">
      <div className="quiz-header">
        <div className="quiz-title">Examen Theologicum</div>
        <div className="quiz-subtitle"><em>Answer 2 of 3 to claim this relic</em></div>
        <div className="quiz-progress">{progressDots}</div>
        <div className="quiz-counter">Question {current + 1} of {questions.length}</div>
      </div>

      <div className="quiz-question">{q.question}</div>

      <div className="quiz-answer-feedback-area">
        {!revealed ? (
          <div className="quiz-answers">
            {q.answers.map((answer, idx) => (
              <button
                key={idx}
                className="quiz-answer-btn"
                onClick={() => handleAnswer(idx)}
              >
                {answer}
              </button>
            ))}
          </div>
        ) : (
          <div className={`quiz-feedback ${answers[current] === 'correct' ? 'quiz-feedback-correct' : 'quiz-feedback-wrong'}`}>
            <div className="quiz-feedback-verdict">
              {answers[current] === 'correct' ? '✓ Recte responsum' : '✗ Non ita'}
            </div>
            <div className="quiz-feedback-explanation">{q.explanation}</div>
            <button className="quiz-ok-btn" onClick={handleOK}>OK →</button>
          </div>
        )}
      </div>
    </div>
  )
}
