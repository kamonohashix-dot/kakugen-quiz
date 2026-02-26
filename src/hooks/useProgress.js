import { useState, useCallback } from 'react'

const STORAGE_KEY = 'kakugen_progress_v1'

// SRS: memory_level ごとの次回復習までの日数
const SRS_INTERVALS = [1, 3, 7, 14, 30, 60]

// consecutive_correct がこの値に達したらマスター
const MASTERY_THRESHOLD = 5

const createDefault = () => ({
  totalAnswered: 0,
  totalCorrect: 0,
  streak: 0,
  maxStreak: 0,
  todayAnswered: 0,
  todayCorrect: 0,
  lastPlayDate: null,
  wrongAnswers: [],      // question id の配列
  categoryProgress: {},  // { [categoryName]: { answered, correct } }
  questionStats: {},     // { [questionId]: questionStat }
})

// questionStats の1エントリのデフォルト値
// 既存データとのマージ時にも使う
const defaultQStat = () => ({
  correct:             0,
  wrong:               0,
  correct_count:       0,
  wrong_count:         0,
  consecutive_correct: 0,
  memory_level:        0,
  last_reviewed:       null,
  next_review:         null,
  mastered_date:       null,
})

function calcNextReview(memoryLevel) {
  const days = SRS_INTERVALS[Math.min(memoryLevel, SRS_INTERVALS.length - 1)]
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

export function useProgress() {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        const today = new Date().toDateString()
        if (parsed.lastPlayDate !== today) {
          const reset = { ...parsed, todayAnswered: 0, todayCorrect: 0, lastPlayDate: today }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(reset))
          return reset
        }
        return parsed
      }
    } catch (_) { /* ignore */ }
    const fresh = { ...createDefault(), lastPlayDate: new Date().toDateString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
    return fresh
  })

  // answers: Array<{ questionId, correct, category }>
  const recordAnswers = useCallback((answers) => {
    setData(prev => {
      const next = { ...prev }
      const today = new Date().toDateString()
      const nowISO = new Date().toISOString()

      if (next.lastPlayDate !== today) {
        next.todayAnswered = 0
        next.todayCorrect = 0
        next.lastPlayDate = today
      }

      const wrongSet = new Set(next.wrongAnswers)
      const catProg = { ...next.categoryProgress }
      const qStats = { ...next.questionStats }

      answers.forEach(({ questionId, correct, category }) => {
        next.totalAnswered++
        next.todayAnswered++

        if (!catProg[category]) catProg[category] = { answered: 0, correct: 0 }
        catProg[category].answered++

        // 既存エントリに新フィールドをマージ（後方互換）
        const qs = { ...defaultQStat(), ...(qStats[questionId] ?? {}) }
        qs.last_reviewed = nowISO

        if (correct) {
          next.totalCorrect++
          next.todayCorrect++
          next.streak++
          next.maxStreak = Math.max(next.maxStreak, next.streak)
          catProg[category].correct++

          qs.correct++
          qs.correct_count++
          qs.consecutive_correct++
          qs.memory_level = Math.min(qs.memory_level + 1, SRS_INTERVALS.length - 1)
          qs.next_review = calcNextReview(qs.memory_level)

          // consecutive_correct が閾値に達したら初回マスター日を記録
          if (qs.consecutive_correct >= MASTERY_THRESHOLD && !qs.mastered_date) {
            qs.mastered_date = nowISO
          }

          wrongSet.delete(questionId)
        } else {
          next.streak = 0

          qs.wrong++
          qs.wrong_count++
          qs.consecutive_correct = 0
          qs.memory_level = Math.max(0, qs.memory_level - 1)
          qs.next_review = calcNextReview(0)  // 翌日に再復習
          qs.mastered_date = null             // マスター解除

          wrongSet.add(questionId)
        }

        qStats[questionId] = qs
      })

      next.wrongAnswers = [...wrongSet]
      next.categoryProgress = catProg
      next.questionStats = qStats

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
