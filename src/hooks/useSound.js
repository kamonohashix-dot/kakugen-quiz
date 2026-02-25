import { useState, useCallback } from 'react'

const STORAGE_KEY = 'kakugen_muted'

// AudioContext シングルトン（ブラウザ制限対応）
function getCtx() {
  if (!window.__kakugenAudioCtx) {
    window.__kakugenAudioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return window.__kakugenAudioCtx
}

// 単音生成ヘルパー
function beep(ctx, freq, type, t0, duration, vol = 0.26) {
  const osc  = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  gain.gain.setValueAtTime(vol, t0)
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

export function useSound() {
  const [isMuted, setIsMuted] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  )

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }, [])

  // AudioContext を起こしてから返す
  const ctx = () => {
    const c = getCtx()
    if (c.state === 'suspended') c.resume()
    return c
  }

  // ─── ピコン！ 2音上昇（正解）
  const playCorrect = useCallback(() => {
    if (isMuted) return
    try {
      const c = ctx()
      const t = c.currentTime
      beep(c, 880,  'sine', t,        0.10, 0.26)  // A5
      beep(c, 1320, 'sine', t + 0.08, 0.18, 0.22)  // E6
    } catch (_) {}
  }, [isMuted])

  // ─── ブッ 短い低音（不正解）
  const playWrong = useCallback(() => {
    if (isMuted) return
    try {
      const c = ctx()
      const t = c.currentTime
      beep(c, 130, 'square', t, 0.22, 0.24)
      // わずかにピッチを下げてより「残念」な感じに
      const osc2 = c.createOscillator()
      const g2   = c.createGain()
      osc2.connect(g2); g2.connect(c.destination)
      osc2.type = 'square'
      osc2.frequency.setValueAtTime(110, t + 0.05)
      osc2.frequency.exponentialRampToValueAtTime(80, t + 0.22)
      g2.gain.setValueAtTime(0.10, t + 0.05)
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
      osc2.start(t + 0.05); osc2.stop(t + 0.24)
    } catch (_) {}
  }, [isMuted])

  // ─── ファンファーレ C5→E5→G5→C6（3連続正解）
  const playStreak = useCallback(() => {
    if (isMuted) return
    try {
      const c = ctx()
      const t = c.currentTime
      // メロディ
      const melody = [523, 659, 784, 1047]
      melody.forEach((freq, i) => {
        const dur = i === melody.length - 1 ? 0.5 : 0.18
        beep(c, freq, 'sine', t + i * 0.13, dur, 0.22)
      })
      // ハーモニー（5度上でやや遅れて）
      beep(c, 1568, 'triangle', t + 0.39, 0.38, 0.10)  // G6
      // ベース感（1オクターブ下）
      beep(c, 261, 'sine', t + 0.39, 0.40, 0.08)        // C4
    } catch (_) {}
  }, [isMuted])

  return { isMuted, toggleMute, playCorrect, playWrong, playStreak }
}
