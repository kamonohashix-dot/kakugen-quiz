import { CATEGORIES, quizData } from '../data/quizData'

export default function MyPageScreen({ onBack, progress }) {
  const {
    totalAnswered, totalCorrect,
    streak, maxStreak,
    todayAnswered, todayCorrect,
    wrongAnswers,
    categoryProgress,
    accuracy, todayAccuracy,
    resetAll,
  } = progress

  const handleReset = () => {
    if (window.confirm('すべての記録をリセットしますか？\nこの操作は元に戻せません。')) {
      resetAll()
    }
  }

  return (
    <div className="screen mypage-screen">
      <header className="screen-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h1 className="screen-title">マイページ</h1>
        <div style={{ width: 40 }} />
      </header>

      <div className="mypage-content">

        {/* ─── 総合成績 ─── */}
        <section className="mypage-section">
          <h2 className="mypage-section-title">📊 総合成績</h2>
          <div className="mypage-stats-grid">
            <div className="mypage-stat">
              <div className="mypage-stat-value">{totalAnswered}</div>
              <div className="mypage-stat-label">総回答数</div>
            </div>
            <div className="mypage-stat">
              <div className="mypage-stat-value mypage-stat--primary">{accuracy}%</div>
              <div className="mypage-stat-label">正解率</div>
            </div>
            <div className="mypage-stat">
              <div className="mypage-stat-value mypage-stat--success">{totalCorrect}</div>
              <div className="mypage-stat-label">総正解数</div>
            </div>
            <div className="mypage-stat">
              <div className="mypage-stat-value mypage-stat--streak">🔥{maxStreak}</div>
              <div className="mypage-stat-label">最大連続正解</div>
            </div>
          </div>
        </section>

        {/* ─── 今日の記録 ─── */}
        <section className="mypage-section">
          <h2 className="mypage-section-title">📅 今日の記録</h2>
          <div className="mypage-today-card">
            <div className="mypage-today-item">
              <span className="mypage-today-value">{todayAnswered}</span>
              <span className="mypage-today-label">回答数</span>
            </div>
            <div className="mypage-today-divider" />
            <div className="mypage-today-item">
              <span className="mypage-today-value mypage-stat--primary">{todayAccuracy}%</span>
              <span className="mypage-today-label">正解率</span>
            </div>
            <div className="mypage-today-divider" />
            <div className="mypage-today-item">
              <span className="mypage-today-value mypage-stat--streak">🔥{streak}</span>
              <span className="mypage-today-label">現在の連続</span>
            </div>
          </div>
        </section>

        {/* ─── カテゴリ別成績 ─── */}
        <section className="mypage-section">
          <h2 className="mypage-section-title">📂 カテゴリ別成績</h2>
          <div className="mypage-category-list">
            {CATEGORIES.map(cat => {
              const catData = categoryProgress[cat.name] ?? { answered: 0, correct: 0 }
              const total = quizData.filter(q => q.category === cat.name).length
              const catAccuracy =
                catData.answered > 0
                  ? Math.round((catData.correct / catData.answered) * 100)
                  : null
              const fillPct = total > 0 ? Math.min((catData.answered / total) * 100, 100) : 0

              return (
                <div
                  key={cat.name}
                  className="mypage-cat-row"
                  style={{ '--cat-color': cat.color }}
                >
                  <span className="mypage-cat-icon">{cat.icon}</span>
                  <div className="mypage-cat-info">
                    <div className="mypage-cat-name">{cat.name}</div>
                    <div className="mypage-cat-bar-wrap">
                      <div className="mypage-cat-bar" style={{ width: `${fillPct}%` }} />
                    </div>
                  </div>
                  <div className="mypage-cat-stats">
                    <div className="mypage-cat-accuracy">
                      {catAccuracy !== null ? `${catAccuracy}%` : '--'}
                    </div>
                    <div className="mypage-cat-count">{catData.answered}/{total}問</div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ─── 苦手問題 ─── */}
        <section className="mypage-section">
          <h2 className="mypage-section-title">🔁 苦手問題</h2>
          <div className="mypage-wrong-card">
            <span className="mypage-wrong-num">{wrongAnswers.length}</span>
            <span className="mypage-wrong-label">
              {wrongAnswers.length > 0 ? '問の苦手問題があります' : '問　苦手問題なし！'}
            </span>
          </div>
        </section>

        {/* ─── リセット ─── */}
        <button className="mypage-reset-btn" onClick={handleReset}>
          🗑 記録をリセット
        </button>

      </div>
    </div>
  )
}
