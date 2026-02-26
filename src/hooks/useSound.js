import { useState, useCallback, useRef } from 'react'

const STORAGE_KEY = 'kakugen_muted'

// ─── MP3 ファイルのパス ───────────────────────────────────────
// public/sounds/ に以下のファイルを置いてください
//   tap.mp3       選択肢タップ時
//   correct.mp3   正解時
//   wrong.mp3     不正解時
//   streak.mp3    3・6・9… 連続正解時
//   fanfare.mp3   クイズ完了時（全問終了）
const SOUND_FILES = {
  tap:     '/sounds/tap.mp3',
  correct: '/sounds/correct.mp3',
  wrong:   '/sounds/wrong.mp3',
  streak:  '/sounds/streak.mp3',
  fanfare: '/sounds/fanfare.mp3',
}

export function useSound() {
  const [isMuted, setIsMuted] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  )

  // Audio インスタンスをキャッシュ（毎回 new Audio() しない）
  const cache = useRef({})

  const getAudio = useCallback((name) => {
    if (!cache.current[name]) {
      const audio = new Audio(SOUND_FILES[name])
      audio.preload = 'auto'
      cache.current[name] = audio
    }
    return cache.current[name]
  }, [])

  const play = useCallback((name) => {
    if (isMuted) return
    try {
      const audio = getAudio(name)
      audio.currentTime = 0          // 連続タップでも最初から再生
      audio.play().catch(() => {})   // ブラウザの autoplay 制限を無視
    } catch (_) {}
  }, [isMuted, getAudio])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }, [])

  // ─── 各タイミングの再生関数 ───────────────────────────────────
  const playTap     = useCallback(() => play('tap'),     [play])  // 選択肢タップ時
  const playCorrect = useCallback(() => play('correct'), [play])  // 正解時
  const playWrong   = useCallback(() => play('wrong'),   [play])  // 不正解時
  const playStreak  = useCallback(() => play('streak'),  [play])  // 3連続正解時
  const playFanfare = useCallback(() => play('fanfare'), [play])  // クイズ完了時

  return { isMuted, toggleMute, playTap, playCorrect, playWrong, playStreak, playFanfare }
}
