import { useState, useCallback } from 'react'
import { applyCorrect, applyWrong, defaultQStat } from '../lib/memoryLevel'

const STORAGE_KEY = 'kakugen_progress_v1'

// 復習遵守率: 期限から24時間以内に回答した場合を「遵守」とみなす
const REVIEW_GRACE_MS = 24 * 60 * 60 * 1000

const createDefault = () => ({
  totalAnswered:   0,
  totalCorrect:    0,
  streak:          0,
  maxStreak:       0,
  todayAnswered:   0,
  todayCorrect:    0,
  lastPlayDate:    null,
  wrongAnswers:    [],
  categoryProgress: {},
  questionStats:   {},
  // 復習遵守率
  reviewsDue:      0,
  reviewsComplied: 0,
  // 連続パーフェクト
  current_perfect_streak:    0,
  best_perfect_streak:       0,
  best_perfect_streak_date:  null,
})

export function useProgress() {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        // デフォルト値をマージして後方互換を保つ
        const merged = { ...createDefault(), ...parsed }
        const today = new Date().toDateString()
        if (merged.lastPlayDate !== today) {
          const reset = { ...merged, todayAnswered: 0, todayCorrect: 0, lastPlayDate: today }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(reset))
          return reset
        }
        return merged
      }
    } catch (_) { /* ignore */ }
    const fresh = { ...createDefault(), lastPlayDate: new Date().toDateString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
    return fresh
  })

  /**
   * クイズ結果を記録する
   * @param {Array<{ questionId, quote, correct, category }>} answers
   * @param {boolean} isPerfect - 全問正解なら true
   */
  const recordAnswers = useCallback((answers, isPerfect = false) => {
    setData(prev => {
      const next = { ...prev }
      const now  = new Date()
      const nowMs = now.getTime()
      const today = new Date().toDateString()

      if (next.lastPlayDate !== today) {
        next.todayAnswered = 0
        next.todayCorrect  = 0
        next.lastPlayDate  = today
      }

      const wrongSet  = new Set(next.wrongAnswers)
      const catProg   = { ...next.categoryProgress }
      const qStats    = { ...next.questionStats }
      let reviewsDue      = next.reviewsDue
      let reviewsComplied = next.reviewsComplied

      answers.forEach(({ questionId, correct, category }) => {
        next.totalAnswered++
        next.todayAnswered++

        if (!catProg[category]) catProg[category] = { answered: 0, correct: 0 }
        catProg[category].answered++

        // 既存データにデフォルト値をマージ（後方互換）
        const qs = { ...defaultQStat(), ...(qStats[questionId] ?? {}) }

        // ── 復習遵守率トラッキング ──
        if (qs.memory_level > 0 && qs.next_review) {
          const nextReviewMs = new Date(qs.next_review).getTime()
          if (nextReviewMs <= nowMs) {
            reviewsDue++
            if (nowMs - nextReviewMs <= REVIEW_GRACE_MS) {
              reviewsComplied++
            }
          }
        }

        // ── 忘却曲線ロジックで更新（ステップ2） ──
        qStats[questionId] = correct
          ? applyCorrect(qs, now)
          : applyWrong(qs, now)

        if (correct) {
          next.totalCorrect++
          next.todayCorrect++
          next.streak++
          next.maxStreak = Math.max(next.maxStreak, next.streak)
          catProg[category].correct++
          wrongSet.delete(questionId)
        } else {
          next.streak = 0
          wrongSet.add(questionId)
        }
      })

      next.wrongAnswers     = [...wrongSet]
      next.categoryProgress = catProg
      next.questionStats    = qStats
      next.reviewsDue       = reviewsDue
      next.reviewsComplied  = reviewsComplied

      // ── 連続パーフェクト更新 ──
      if (isPerfect) {
        next.current_perfect_streak = (next.current_perfect_streak ?? 0) + 1
        if (next.current_perfect_streak > (next.best_perfect_streak ?? 0)) {
          next.best_perfect_streak      = next.current_perfect_streak
          next.best_perfect_streak_date = now.toISOString()
        }
      } else {
        next.current_perfect_streak = 0
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const resetAll = useCallback(() => {
    const fresh = { ...createDefault(), lastPlayDate: new Date().toDateString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
    setData(fresh)
  }, [])

  const accuracy =
    data.totalAnswered > 0 ? Math.round((data.totalCorrect / data.totalAnswered) * 100) : 0
  const todayAccuracy =
    data.todayAnswered > 0 ? Math.round((data.todayCorrect / data.todayAnswered) * 100) : 0

  return { ...data, accuracy, todayAccuracy, recordAnswers, resetAll }
}
