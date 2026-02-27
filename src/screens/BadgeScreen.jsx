import { CATEGORIES, quizData } from '../data/quizData'
import { MASTERED_LEVEL }        from '../lib/memoryLevel'
import { PERFECT_STAGES, getNextPerfectStage } from '../lib/calcScore'

export default function BadgeScreen({ progress }) {
  const {
    questionStats         = {},
    current_perfect_streak = 0,
    best_perfect_streak    = 0,
    best_perfect_streak_date,
  } = progress

  // カテゴリごとの MASTERED 数を計算
  const categoryStats = CATEGORIES.map(cat => {
    const questions = quizData.filter(q => q.category === cat.name)
    const total     = questions.length
    const mastered  = questions.filter(
      q => (questionStats[q.id]?.memory_level ?? 0) >= MASTERED_LEVEL
    ).length
    const done = total > 0 && mastered >= total
    return { ...cat, total, mastered, done }
  })

  const completedCount = categoryStats.filter(c => c.done).length
  const nextStage      = getNextPerfectStage(current_perfect_streak)

  const bestDate = best_perfect_streak_date
    ? new Date(best_perfect_streak_date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
    : null

  return (
    <div className="badge-screen">

      {/* ─── カテゴリバッジ ─── */}
      <div className="badge-section">
        <div className="badge-section-header">
          <span className="badge-section-title">🏅 カテゴリバッジ</span>
          <span className="badge-count-chip">🏅 × {completedCount} / {CATEGORIES.length}</span>
        </div>

        {categoryStats.map((cat, i) => (
          <div key={i} className="badge-cat-row">
            <div className="badge-cat-head">
              <div className="badge-cat-left">
                {cat.done && <span className="badge-medal">🏅</span>}
                <span className="badge-cat-icon">{cat.icon}</span>
                <span className={`badge-cat-name${cat.done ? ' badge-cat-name--done' : ''}`}>
                  {cat.name}
                </span>
              </div>
              <span className={`badge-cat-status${cat.done ? ' badge-cat-status--done' : ''}`}>
                {cat.done
                  ? '制覇済！'
                  : `${cat.mastered}/${cat.total}　あと${cat.total - cat.mastered}枚`}
              </span>
            </div>
            <div className="badge-bar-wrap">
              <div
                className="badge-bar-fill"
                style={{
                  width: cat.total > 0 ? `${Math.min((cat.mastered / cat.total) * 100, 100)}%` : '0%',
                  background: cat.done ? 'var(--secondary)' : cat.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ─── 連続パーフェクトチャレンジ ─── */}
      <div className="badge-section">
        <div className="badge-section-title">🔥 連続正解チャレンジ</div>

        <div className="badge-perfect-summary">
          <div className="badge-perfect-item">
            <div className="badge-perfect-num">{current_perfect_streak}</div>
            <div className="badge-perfect-label">現在の連続パーフェクト</div>
          </div>
          {nextStage && (
            <>
              <div className="badge-perfect-arrow">→</div>
              <div className="badge-perfect-item">
                <div className="badge-perfect-stage">{nextStage.emoji}</div>
                <div className="badge-perfect-label">{nextStage.name}</div>
                <div className="badge-perfect-need">（{nextStage.count}回達成）</div>
              </div>
            </>
          )}
        </div>

        {nextStage && (
          <div className="badge-bar-wrap" style={{ marginBottom: 12 }}>
            <div
              className="badge-bar-fill badge-bar-fill--gold"
              style={{
                width: `${Math.min((current_perfect_streak / nextStage.count) * 100, 100)}%`,
              }}
            />
          </div>
        )}

        <div className="badge-perfect-record">
          📊 最高記録: <strong>{best_perfect_streak}回</strong>
          {bestDate && <span>（{bestDate} 達成）</span>}
        </div>

        {/* 達成段階リスト */}
        <div className="badge-stages">
          {PERFECT_STAGES.map((stage, i) => (
            <div
              key={i}
              className={`badge-stage-row${current_perfect_streak >= stage.count ? ' badge-stage-row--achieved' : ''}`}
            >
              <span className="badge-stage-emoji">{stage.emoji}</span>
              <span className="badge-stage-name">{stage.name}</span>
              <span className="badge-stage-count">{stage.count}回</span>
              {current_perfect_streak >= stage.count && (
                <span className="badge-stage-check">✓</span>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
