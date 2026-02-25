import { useState, useCallback } from 'react'

const STORAGE_KEY = 'kakugen_progress_v1'

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
  questionStats: {},     // { [questionId]: { correct, wrong } }
})

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

        if (!qStats[questionId]) qStats[questionId] = { correct: 0, wrong: 0 }

        if (correct) {
          next.totalCorrect++
          next.todayCorrect++
          next.streak++
          next.maxStreak = Math.max(next.maxStreak, next.streak)
          catProg[category].correct++
          qStats[questionId].correct++
          wrongSet.delete(questionId)
        } else {
          next.streak = 0
          qStats[questionId].wrong++
          wrongSet.add(questionId)
        }
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
