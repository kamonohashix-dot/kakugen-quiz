import Mascot from '../components/Mascot'

function StatCard({ icon, value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function ActionBtn({ icon, title, sub, variant, onClick, disabled }) {
  return (
    <button
      className={`action-btn action-btn--${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="action-btn-icon">{icon}</span>
      <div>
        <div className="action-btn-title">{title}</div>
        <div className="action-btn-sub">{sub}</div>
      </div>
    </button>
  )
}

export default function HomeScreen({ onStartQuiz, onCategorySelect, onMyPage, progress, sound }) {
  const {
    todayAnswered, todayCorrect,
    streak, accuracy,
    wrongAnswers,
  } = progress

  const todayAccuracy =
    todayAnswered > 0 ? Math.round((todayCorrect / todayAnswered) * 100) : 0

  const mascotState = streak >= 3 ? 'happy' : 'idle'
  const mascotMsg =
    streak >= 10 ? `🔥 ${streak}連続正解！最強！` :
    streak >= 5  ? `${streak}連続正解中！すごい！` :
    streak >= 3  ? `🔥 ${streak}連続正解！絶好調！` :
    todayAnswered === 0 ? 'さあ、今日も格言を学ぼう！' :
    'よく頑張ってるね！続けよう！'

  return (
    <div className="screen home-screen">
      {/* ─── Header ─── */}
      <header className="home-header">
        <div className="home-title">相場の格言道場</div>
        <div className="home-header-right">
          {streak > 0 && (
            <div className="streak-badge">
              <span>🔥</span>
              <span>{streak}</span>
            </div>
          )}
          <button
            className={`mute-btn${sound.isMuted ? ' mute-btn--muted' : ''}`}
            onClick={sound.toggleMute}
            aria-label={sound.isMuted ? '音をオンにする' : '音をオフにする'}
          >
            {sound.isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      {/* ─── Mascot ─── */}
      <div className="home-mascot">
        <Mascot state={mascotState} size="lg" />
        <p className="mascot-message">{mascotMsg}</p>
      </div>

      {/* ─── Stats ─── */}
      <div className="stats-grid">
        <StatCard icon="📚" value={todayAnswered} label="今日の問題" />
        <StatCard icon="🎯" value={`${todayAccuracy}%`} label="今日の正解率" />
        <StatCard icon="🔥" value={streak} label="連続正解" />
        <StatCard icon="🏆" value={`${accuracy}%`} label="総合正解率" />
      </div>

      {/* ─── Action Buttons ─── */}
      <div className="action-buttons">
        <ActionBtn
          icon="⚡"
          title="格言クイズ"
          sub="ランダム5問"
          variant="primary"
          onClick={() => onStartQuiz('random')}
        />
        <ActionBtn
          icon="📂"
          title="カテゴリ学習"
          sub="テーマ別に学ぶ"
          variant="secondary"
          onClick={onCategorySelect}
        />
        <ActionBtn
          icon="🔁"
          title="復習モード"
          sub={wrongAnswers.length > 0 ? `${wrongAnswers.length}問を復習` : '復習する問題なし'}
          variant="warning"
          onClick={() => onStartQuiz('review')}
          disabled={wrongAnswers.length === 0}
        />
        <ActionBtn
          icon="👤"
          title="マイページ"
          sub="スコア・成績を確認"
          variant="challenge"
          onClick={onMyPage}
        />
      </div>
    </div>
  )
}
