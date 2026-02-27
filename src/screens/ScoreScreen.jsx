import { calcScore, getTitle, getNextTitle } from '../lib/calcScore'

function ScoreBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="score-bar-wrap">
      <div className="score-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export default function ScoreScreen({ progress, totalQuestions }) {
  const s        = calcScore(progress, totalQuestions)
  const title    = getTitle(s.total)
  const next     = getNextTitle(s.total)
  const { streak = 0, current_perfect_streak = 0, best_perfect_streak = 0 } = progress

  // スコア内訳
  const breakdown = [
    { label: 'MASTERED枚数',  detail: `${s.masteredCount}/${totalQuestions}枚`, pts: s.A, max: 40, color: 'var(--success)' },
    { label: '全体正答率',    detail: `${s.accuracy}%`,                          pts: s.B, max: 30, color: 'var(--secondary)' },
    { label: 'ストリーク',    detail: `${streak}連続`,                           pts: s.C, max: 15, color: '#FF5722' },
    { label: '復習遵守率',    detail: `${s.complianceRate}%`,                    pts: s.D, max: 15, color: 'var(--primary)' },
  ]

  // 最も改善余地が大きい要素
  const hint = [...breakdown].sort((a, b) => (a.pts / a.max) - (b.pts / b.max))[0]

  return (
    <div className="score-screen">

      {/* ─── 称号カード ─── */}
      <div className="score-title-card">
        <div className="score-title-icon">{title.icon}</div>
        <div className="score-title-name">{title.name}</div>
        <div className="score-total">{s.total.toFixed(1)}</div>
        <div className="score-top">{title.top}</div>

        {next && (
          <div className="score-next-wrap">
            <div className="score-next-label">
              次の称号 → {next.icon} {next.name}
            </div>
            <ScoreBar value={s.total} max={next.min} color="var(--primary)" />
            <div className="score-next-remain">
              あと <strong>{(next.min - s.total).toFixed(1)}</strong> で昇格！
            </div>
          </div>
        )}
      </div>

      {/* ─── スコア内訳 ─── */}
      <div className="score-section">
        <div className="score-section-title">📊 スコア内訳</div>
        {breakdown.map((b, i) => (
          <div key={i} className="score-breakdown-row">
            <div className="score-breakdown-head">
              <span className="score-breakdown-label">{b.label}</span>
              <span className="score-breakdown-detail">{b.detail}</span>
              <span className="score-breakdown-pts" style={{ color: b.color }}>
                {b.pts.toFixed(1)} / {b.max}
              </span>
            </div>
            <ScoreBar value={b.pts} max={b.max} color={b.color} />
          </div>
        ))}

        <div className="score-hint">
          💡 <strong>{hint.label}</strong> を上げるとスコアが伸びます！
        </div>
      </div>

      {/* ─── 連続パーフェクト ─── */}
      <div className="score-section">
        <div className="score-section-title">🎯 連続パーフェクト</div>
        <div className="score-perfect-row">
          <div className="score-perfect-item">
            <div className="score-perfect-num">{current_perfect_streak}</div>
            <div className="score-perfect-label">現在の連続</div>
          </div>
          <div className="score-perfect-divider" />
          <div className="score-perfect-item">
            <div className="score-perfect-num">{best_perfect_streak}</div>
            <div className="score-perfect-label">最高記録</div>
          </div>
        </div>
      </div>

    </div>
  )
}
