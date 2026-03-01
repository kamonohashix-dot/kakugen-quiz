import { useState, useMemo } from 'react'
import Mascot from '../components/Mascot'
import { CALENDAR_EVENTS, getEventIcon } from '../data/calendarEvents'
import { quizData } from '../data/quizData'
import {
  getLevelFromExp,
  getLevelThreshold,
  getNextLevelThreshold,
  getLoginTitle,
} from '../lib/expSystem'

// ── 格言ファジーマッチ ───────────────────────────────────────
function longestCommonSubstring(a, b) {
  let max = 0
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      let len = 0
      while (i + len < a.length && j + len < b.length && a[i + len] === b[j + len]) len++
      if (len > max) max = len
    }
  }
  return max
}

function findMatchingQuestion(kakugenStr) {
  // 1. 完全一致
  let q = quizData.find(q => q.quote === kakugenStr)
  if (q) return q
  // 2. 部分一致（どちらかがもう一方を含む）
  q = quizData.find(q => q.quote.includes(kakugenStr) || kakugenStr.includes(q.quote))
  if (q) return q
  // 3. 長い共通部分文字列（表記ゆれ対応）
  q = quizData.find(q => longestCommonSubstring(q.quote, kakugenStr) >= 6)
  return q ?? null
}

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

// ── 今日の格言ミニクイズカード ──────────────────────────────
function TodayKakugenCard({ event, question, sound }) {
  const [answered, setAnswered] = useState(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { shuffledChoices, shuffledCorrect } = useMemo(
    () => shuffleChoices(question.choices, question.correct),
    [question.id],
  )

  const handleAnswer = (idx) => {
    if (answered !== null) return
    setAnswered(idx)
    if (idx === shuffledCorrect) {
      sound?.playCorrect?.()
    } else {
      sound?.playWrong?.()
    }
  }

  const isCorrect = answered !== null && answered === shuffledCorrect

  return (
    <div className="today-kakugen-card">
      <div className="today-kakugen-header">
        <span className="today-kakugen-badge">📖 今日の格言</span>
        <span className="today-kakugen-event-label">
          {getEventIcon(event.type)} {event.year}年 {event.title}
        </span>
      </div>

      <div className="today-kakugen-question">
        「{question.quote}」
        <div className="today-kakugen-author">— {question.author}</div>
      </div>

      <div className="today-kakugen-prompt">この格言の意味は？</div>

      <div className="today-kakugen-choices">
        {shuffledChoices.map((choice, idx) => {
          let cls = 'today-kakugen-choice'
          if (answered !== null) {
            if (idx === shuffledCorrect)  cls += ' today-kakugen-choice--correct'
            else if (idx === answered)    cls += ' today-kakugen-choice--wrong'
          }
          return (
            <button key={idx} className={cls} onClick={() => handleAnswer(idx)}>
              {choice}
            </button>
          )
        })}
      </div>

      {answered !== null && (
        <div className={`today-kakugen-result${isCorrect ? ' today-kakugen-result--correct' : ' today-kakugen-result--wrong'}`}>
          <div className="today-kakugen-result-label">
            {isCorrect ? '🎉 正解！' : '😢 不正解...'}
          </div>
          <div className="today-kakugen-explanation">{question.explanation}</div>
        </div>
      )}
    </div>
  )
}

// ── 経験値バー ──────────────────────────────────────────────
function LevelBar({ exp, level }) {
  const nextThreshold = getNextLevelThreshold(level)
  const curThreshold  = getLevelThreshold(level)
  const pct = nextThreshold
    ? Math.min(((exp - curThreshold) / (nextThreshold - curThreshold)) * 100, 100)
    : 100

  return (
    <div className="home-level-section">
      <div className="home-level-row">
        <span className="home-level-badge">Lv.{level}</span>
        <span className="home-level-xp">
          経験値 {exp.toLocaleString()} / {nextThreshold ? nextThreshold.toLocaleString() : '—'}
        </span>
      </div>
      <div className="home-level-bar-track">
        <div className="home-level-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      {nextThreshold && (
        <div className="home-level-remain">
          次のレベルまであと <strong>{(nextThreshold - exp).toLocaleString()}</strong>
        </div>
      )}
      {!nextThreshold && (
        <div className="home-level-remain">最高レベル到達！</div>
      )}
    </div>
  )
}

// ── 連続デイリークリアカード ────────────────────────────────
function ClearStreakCard({ days }) {
  if (days === 0) return null
  const titleInfo = getLoginTitle(days)
  return (
    <div className="home-clear-streak">
      <div className="home-clear-streak-days">🔥{days}</div>
      <div className="home-clear-streak-info">
        <div className="home-clear-streak-label">日連続デイリークリア</div>
        <div className="home-clear-streak-title">{titleInfo.icon} {titleInfo.name}</div>
      </div>
    </div>
  )
}

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

export default function HomeScreen({ onStartQuiz, onCategorySelect, progress, sound }) {
  const {
    todayAnswered, todayCorrect,
    streak, accuracy,
    wrongAnswers,
    exp = 0,
    consecutiveClearDays = 0,
  } = progress

  const level = getLevelFromExp(exp)

  const todayAccuracy =
    todayAnswered > 0 ? Math.round((todayCorrect / todayAnswered) * 100) : 0

  const mascotState = streak >= 3 ? 'happy' : 'idle'
  const mascotMsg =
    streak >= 10 ? `🔥 ${streak}連続正解！最強！` :
    streak >= 5  ? `${streak}連続正解中！すごい！` :
    streak >= 3  ? `🔥 ${streak}連続正解！絶好調！` :
    todayAnswered === 0 ? 'さあ、今日も格言を学ぼう！' :
    'よく頑張ってるね！続けよう！'

  // 今月の相場カレンダーイベント
  const today = new Date()
  const currentMonth = today.getMonth() + 1
  const currentDay   = today.getDate()
  const thisMonthEvents = CALENDAR_EVENTS
    .filter(e => e.month === currentMonth)
    .sort((a, b) => a.day - b.day)
  const todayEvents = thisMonthEvents.filter(e => e.day === currentDay)

  // 今日の格言ミニクイズ（今日のイベントの格言とquizDataをマッチング）
  let todayKakugenEntry = null
  for (const ev of todayEvents) {
    for (const k of ev.kakugen) {
      const q = findMatchingQuestion(k)
      if (q) {
        todayKakugenEntry = { event: ev, question: q }
        break
      }
    }
    if (todayKakugenEntry) break
  }

  return (
    <div className="screen home-screen">
      {/* ─── Header ─── */}
      <header className="home-header">
        <div className="home-title-group">
          <div className="home-title">株格言＋（ぷらす）</div>
          <div className="home-subtitle">～レジェンド達の知恵は武器！格言を制する者は相場を制す！～</div>
        </div>
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

      {/* ─── 経験値バー ─── */}
      <LevelBar exp={exp} level={level} />

      {/* ─── 連続デイリークリア ─── */}
      <ClearStreakCard days={consecutiveClearDays} />

      {/* ─── Mascot ─── */}
      <div className="home-mascot">
        <Mascot state={mascotState} size="lg" />
        <p className="mascot-message">{mascotMsg}</p>
      </div>

      {/* ─── Stats ─── */}
      <div className="stats-grid">
        <StatCard icon="📚" value={todayAnswered}      label="今日の問題" />
        <StatCard icon="🎯" value={`${todayAccuracy}%`} label="今日の正解率" />
        <StatCard icon="🔥" value={streak}              label="連続正解" />
        <StatCard icon="🏆" value={`${accuracy}%`}      label="総合正解率" />
      </div>

      {/* ─── 今日の格言ミニクイズ ─── */}
      {todayKakugenEntry && (
        <TodayKakugenCard
          event={todayKakugenEntry.event}
          question={todayKakugenEntry.question}
          sound={sound}
        />
      )}

      {/* ─── Action Buttons ─── */}
      <div className="action-buttons">
        <ActionBtn
          icon="⚡"
          title="今日の格言クイズ"
          sub="ランダム5問"
          variant="primary"
          onClick={() => { sound.playTap(); onStartQuiz('random') }}
        />
        <ActionBtn
          icon="📂"
          title="カテゴリ学習"
          sub="テーマ別に学ぶ"
          variant="secondary"
          onClick={() => { sound.playTap(); onCategorySelect() }}
        />
        <ActionBtn
          icon="🔁"
          title="復習モード"
          sub={wrongAnswers.length > 0 ? `${wrongAnswers.length}問を復習` : '復習する問題なし'}
          variant="warning"
          onClick={() => { sound.playTap(); onStartQuiz('review') }}
          disabled={wrongAnswers.length === 0}
        />
      </div>

      {/* ─── 相場カレンダー ─── */}
      {thisMonthEvents.length > 0 && (
        <div className="calendar-section">
          <div className="calendar-section-title">📅 相場カレンダー（{currentMonth}月）</div>

          {/* todayKakugenEntry がある場合はカードで表示済みなので省略 */}
          {!todayKakugenEntry && todayEvents.length > 0 && todayEvents.map((ev, i) => (
            <div key={i} className="calendar-today-event">
              <span className="calendar-event-icon">{getEventIcon(ev.type)}</span>
              <div>
                <div className="calendar-event-title">本日 — {ev.year}年 {ev.title}</div>
                {ev.kakugen.map((k, j) => (
                  <div key={j} className="calendar-event-kakugen">「{k}」</div>
                ))}
              </div>
            </div>
          ))}

          <div className="calendar-month-list">
            {thisMonthEvents.map((ev, i) => (
              <div key={i} className="calendar-month-item">
                <span className="calendar-month-date">{ev.month}/{ev.day}</span>
                <span className="calendar-month-icon">{getEventIcon(ev.type)}</span>
                <span className="calendar-month-title">{ev.year}年 {ev.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ height: 12 }} />
    </div>
  )
}
