import { CATEGORIES, quizData } from '../data/quizData'
import { getCategoryLevel } from '../lib/expSystem'

export default function CategoryScreen({ onBack, onSelectCategory, progress, sound }) {
  const { categoryProgress, categoryExp = {} } = progress

  return (
    <div className="screen category-screen">
      <header className="screen-header">
        <button className="back-btn" onClick={() => { sound?.playTap?.(); onBack() }}>←</button>
        <h1 className="screen-title">カテゴリ学習</h1>
        <div style={{ width: 40 }} />
      </header>

      <div className="category-grid">
        {CATEGORIES.map(cat => {
          const count  = quizData.filter(q => q.category === cat.name).length
          const catData = categoryProgress[cat.name] ?? { answered: 0, correct: 0 }
          const catAccuracy =
            catData.answered > 0
              ? Math.round((catData.correct / catData.answered) * 100)
              : null
          const fillPct =
            count > 0 ? Math.min((catData.answered / count) * 100, 100) : 0
          const catLv = getCategoryLevel(categoryExp[cat.name] ?? 0)

          return (
            <button
              key={cat.name}
              className="category-card"
              style={{ '--cat-color': cat.color }}
              onClick={() => { sound?.playTap?.(); onSelectCategory(cat.name) }}
              disabled={count === 0}
            >
              <div className="category-icon">{cat.icon}</div>
              <div className="category-name">{cat.name}</div>
              <div className="category-name-sub">
                <span className="category-count">
                  {count > 0 ? `${count}問` : '準備中'}
                </span>
                {(categoryExp[cat.name] ?? 0) > 0 && (
                  <span className="category-level-badge">Lv.{catLv}</span>
                )}
              </div>
              {catAccuracy !== null && (
                <div className="category-accuracy">{catAccuracy}%</div>
              )}
              <div
                className="category-progress-bar"
                style={{ width: `${fillPct}%` }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
