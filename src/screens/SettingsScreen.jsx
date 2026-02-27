import { useState, useCallback } from 'react'

const NOTIF_KEY = 'kakugen_notifications_v1'

const DEFAULT_NOTIFS = [
  { id: 'morning', label: '朝の通知',  time: '08:50', on: true  },
  { id: 'noon',    label: '昼の通知',  time: '12:00', on: true  },
  { id: 'night',   label: '夜の通知',  time: '21:00', on: true  },
]

function loadNotifs() {
  try {
    const raw = localStorage.getItem(NOTIF_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return DEFAULT_NOTIFS
}

function Toggle({ on, onToggle }) {
  return (
    <div className="settings-toggle" onClick={onToggle} role="switch" aria-checked={on}>
      <div className={`settings-toggle-knob${on ? ' settings-toggle-knob--on' : ''}`} />
    </div>
  )
}

export default function SettingsScreen({ progress, onReset }) {
  const [notifs, setNotifs] = useState(loadNotifs)
  const [permStatus, setPermStatus] = useState(() =>
    'Notification' in window ? Notification.permission : 'unsupported'
  )

  const saveNotifs = useCallback((next) => {
    setNotifs(next)
    localStorage.setItem(NOTIF_KEY, JSON.stringify(next))
  }, [])

  const toggleNotif = async (id) => {
    const target = notifs.find(n => n.id === id)
    if (!target) return

    // 初めてONにするとき → 通知許可をリクエスト
    if (!target.on && permStatus !== 'granted') {
      if ('Notification' in window && permStatus !== 'denied') {
        const result = await Notification.requestPermission()
        setPermStatus(result)
        if (result !== 'granted') return
      } else {
        return
      }
    }

    saveNotifs(notifs.map(n => n.id === id ? { ...n, on: !n.on } : n))
  }

  const changeTime = (id, time) => {
    saveNotifs(notifs.map(n => n.id === id ? { ...n, time } : n))
  }

  const handleReset = () => {
    if (window.confirm('すべての記録をリセットしますか？\nこの操作は元に戻せません。')) {
      onReset()
    }
  }

  return (
    <div className="settings-screen">

      {/* ─── 通知設定 ─── */}
      <div className="settings-section">
        <div className="settings-section-title">🔔 通知設定</div>

        {permStatus === 'denied' && (
          <div className="settings-warn">
            ⚠️ 通知がブロックされています。ブラウザの設定から許可してください。
          </div>
        )}
        {permStatus === 'unsupported' && (
          <div className="settings-warn">
            このブラウザは通知に対応していません。
          </div>
        )}

        {notifs.map((n, i) => (
          <div key={n.id} className={`settings-row${i < notifs.length - 1 ? ' settings-row--border' : ''}`}>
            <div className="settings-row-left">
              <div className="settings-row-label">{n.label}</div>
              <input
                type="time"
                value={n.time}
                onChange={e => changeTime(n.id, e.target.value)}
                className="settings-time-input"
                disabled={!n.on}
              />
            </div>
            <Toggle on={n.on} onToggle={() => toggleNotif(n.id)} />
          </div>
        ))}

        <div className="settings-note">
          ※ 通知はアプリを開いている間のみ動作します
        </div>
      </div>

      {/* ─── アプリ情報 ─── */}
      <div className="settings-section">
        <div className="settings-section-title">📱 アプリ情報</div>
        {[
          { label: 'アプリ名',     value: '相場の格言道場' },
          { label: 'バージョン',   value: '1.0.0'          },
          { label: '格言データ',   value: `${progress?.totalAnswered ?? 0}問回答済み` },
          { label: 'データ保存',   value: '端末内のみ'     },
        ].map((item, i, arr) => (
          <div key={i} className={`settings-info-row${i < arr.length - 1 ? ' settings-row--border' : ''}`}>
            <span className="settings-info-label">{item.label}</span>
            <span className="settings-info-value">{item.value}</span>
          </div>
        ))}
      </div>

      {/* ─── データリセット ─── */}
      <div className="settings-section">
        <div className="settings-section-title">⚠️ データ管理</div>
        <button className="settings-reset-btn" onClick={handleReset}>
          🗑 すべての記録をリセット
        </button>
        <div className="settings-note">この操作は元に戻せません</div>
      </div>

    </div>
  )
}
