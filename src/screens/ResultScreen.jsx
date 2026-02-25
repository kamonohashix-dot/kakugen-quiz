import Mascot from '../components/Mascot'

function Stars({ count }) {
  return (
    <div className="result-stars">
      {[1, 2, 3].map(n => (
        <span
          key={n}
          className={`star ${n <= count ? 'star--filled' : 'star--empty'}`}
          style={{ animationDelay: `${(n - 1) * 0.15}s` }}
        >
          ⭐
        </span>
      ))}
    </div>
  )
}

function Confetti() {
  const items = ['🎉', '🎊', '⭐', '✨', '💫', '🌟', '🎈', '🏆']
  return (
    <div className="confetti-container" aria-hidden="true">
      {Array.from({ length: 16 }).map((_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 0.8}s`,
            fontSize: `${14 + Math.random() * 14}px`,
          }}
        >
          {items[i % items.length]}
        </span>
      ))}
    </div>
  )
}

export default function ResultScreen({ result, onHome, onRetry }) {
  const { answers } = result
  const total    = answers.length
  const correct  = answers.filter(a => a.correct).length
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const stars    = accuracy >= 90 ? 3 : accuracy >= 60 ? 2 : accuracy >= 30 ? 1 : 0
  const perfect  = accuracy === 100

  const message =
    perfect        ? '完璧！全問正解！🎊' :
    accuracy >= 80 ? 'すごい！よくできました！' :
    accuracy >= 60 ? 'なかなか良い成績！' :
    accuracy >= 40 ? 'もう少し！次は頑張ろう！' :
    '難しかったね！復習しよう！'

  return (
    <div className="screen result-screen">
      {perfect && <Confetti />}

      <div className="result-content">
        <h1 className="result-title">結果発表</h1>

        <div className="result-mascot">
          <Mascot state={accuracy >= 60 ? 'happy' : 'sad'} size="lg" />
        </div>

        <p className="result-message">{message}</p>

        <Stars count={stars} />

        {/* Score card */}
        <div className="result-score-card">
          <div className="result-score-big">
            <span className="result-correct">{correct}</span>
            <span className="result-divider"> / </span>
            <span className="result-total">{total}</span>
          </div>
          <div className="result-accuracy">{accuracy}% 正解</div>
        </div>

        {/* Per-question breakdown */}
        <div className="result-breakdown">
          {answers.map((a, i) => (
            <div
              key={i}
              className={`result-item result-item--${a.correct ? 'correct' : 'wrong'}`}
            >
              <span>{a.correct ? '✅' : '❌'}</span>
              <span className="result-item-quote">
                {a.quote.length > 12 ? a.quote.slice(0, 12) + '…' : a.quote}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="result-actions">
          <button className="result-btn result-btn--retry" onClick={onRetry}>
            🔄 もう一度
          </button>
          <button className="result-btn result-btn--home" onClick={onHome}>
            🏠 ホームへ
          </button>
        </div>
      </div>
    </div>
  )
}
