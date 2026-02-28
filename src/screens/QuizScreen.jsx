import { useState, useCallback, useMemo } from 'react'
import Mascot from '../components/Mascot'
import { CATEGORIES } from '../data/quizData'

function shuffleChoices(choices, correctIndex) {
  const items = choices.map((text, i) => ({ text, isCorrect: i === correctIndex }))
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return {
    shuffledChoices: items.map(c => c.text),
    shuffledCorrect: items.findIndex(c => c.isCorrect),
  }
}

export default function QuizScreen({ config, onComplete, onBack, sound }) {
  const { questions } = config

  const [currentIndex, setCurrentIndex]     = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [mascotState, setMascotState]       = useState('idle')
  const [answers, setAnswers]               = useState([])
  const [sessionStreak, setSessionStreak]   = useState(0)

  const current    = questions[currentIndex]
  const isAnswered = selectedAnswer !== null
  const progress   = ((currentIndex) / questions.length) * 100
  const cat        = CATEGORIES.find(c => c.name === current?.category)

  const { shuffledChoices, shuffledCorrect } = useMemo(
    () => current
      ? shuffleChoices(current.choices, current.correct)
      : { shuffledChoices: [], shuffledCorrect: 0 },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIndex],
  )

  const isCorrect = selectedAnswer === shuffledCorrect

  const handleAnswer = useCallback((idx) => {
    if (isAnswered || !current) return

    const correct = idx === shuffledCorrect
    setSelectedAnswer(idx)
    setMascotState(correct ? 'happy' : 'sad')
    setShowExplanation(true)
    setAnswers(prev => [
      ...prev,
      { questionId: current.id, quote: current.quote, correct, category: current.category },
    ])

    // 効果音
    if (correct) {
      setSessionStreak(prev => prev + 1)
      sound.playCorrect()
    } else {
      setSessionStreak(0)
      sound.playWrong()
    }

    if (navigator.vibrate) {
      navigator.vibrate(correct ? [40] : [80, 40, 80])
    }
  }, [isAnswered, current, shuffledCorrect, sessionStreak, sound])

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      sound.playFanfare()              // クイズ完了時（全問終了）
      onComplete({ answers: [...answers] })
    } else {
      setCurrentIndex(i => i + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
      setMascotState('idle')
      // sessionStreak はリセットしない（連続正解をクイズ全体で追跡）
    }
  }

  const getButtonClass = (idx) => {
    if (!isAnswered) return 'choice-btn'
    if (idx === shuffledCorrect) return 'choice-btn choice-btn--correct'
    if (idx === selectedAnswer)  return 'choice-btn choice-btn--wrong'
    return 'choice-btn choice-btn--dim'
  }

  if (!current) return null

  return (
    <div className="screen quiz-screen">
      {/* ─── Header ─── */}
      <header className="quiz-header">
        <button className="back-btn" onClick={() => { sound.playTap(); onBack() }}>←</button>
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="quiz-count">{currentIndex + 1}/{questions.length}</div>
        <button
          className={`mute-btn${sound.isMuted ? ' mute-btn--muted' : ''}`}
          onClick={sound.toggleMute}
          aria-label={sound.isMuted ? '音をオンにする' : '音をオフにする'}
        >
          {sound.isMuted ? '🔇' : '🔊'}
        </button>
      </header>

      <div className="quiz-content">
        {/* Mascot */}
        <div className="quiz-mascot">
          <Mascot state={mascotState} size="md" />
        </div>

        {/* Category badge */}
        <div className="category-badge" style={{ background: cat?.color ?? '#FF6B35' }}>
          {cat?.icon} {current.category}
        </div>

        {/* Quote card */}
        <div className="quote-card">
          <div className="quote-text">「{current.quote}」</div>
          <div className="quote-author">— {current.author}</div>
        </div>

        {/* Choices */}
        <div className="choices-container">
          {shuffledChoices.map((choice, idx) => (
            <button
              key={idx}
              className={getButtonClass(idx)}
              onClick={() => handleAnswer(idx)}
              disabled={isAnswered}
            >
              <span className="choice-letter">{['A', 'B', 'C'][idx]}</span>
              <span className="choice-text">{choice}</span>
              {isAnswered && idx === shuffledCorrect && (
                <span className="choice-mark">✓</span>
              )}
              {isAnswered && idx === selectedAnswer && !isCorrect && (
                <span className="choice-mark">✗</span>
              )}
            </button>
          ))}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className={`explanation-card explanation-card--${isCorrect ? 'correct' : 'wrong'}`}>
            <div className="explanation-header">
              {isCorrect ? '✅ 正解！素晴らしい！' : '❌ 不正解…'}
            </div>
            <p className="explanation-text">{current.explanation}</p>
            <button className="next-btn" onClick={handleNext}>
              {currentIndex + 1 >= questions.length ? '結果を見る 🎉' : '次の問題 →'}
            </button>
          </div>
        )}

        {/* Spacer for safe area */}
        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}
