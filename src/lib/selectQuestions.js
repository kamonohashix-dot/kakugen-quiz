/**
 * 5問出題選択アルゴリズム
 *
 * 優先度（高い順）:
 *   1. 期限切れ復習  — next_review < now、かつ降格カードでない
 *   2. 降格カード    — was_demoted=true かつ last_reviewed が直近24時間以内 かつ next_review < now
 *   3. 当日復習      — next_review が今日中（now〜23:59）
 *   4. 新規          — memory_level = 0
 *   5. 長期確認      — memory_level = 7(MASTERED) かつ next_review < now
 *
 * 配分ルール:
 *   復習(1〜3)が5枚以上 → 復習のみ5問
 *   復習が3枚           → 復習3問 + 新規2問（基本パターン）
 *   復習が不足          → 新規で補完 → それでも足りなければ長期確認で補完
 *   出題可能数 < 5      → 全部出す（5問未満になる場合あり）
 */

import { defaultQStat, MASTERED_LEVEL } from './memoryLevel'

const TOTAL             = 5
const DEMOTE_WINDOW_MS  = 24 * 60 * 60 * 1000   // 降格カード判定ウィンドウ: 24時間

// ──────────────────────────────────────────────
//  メイン関数
// ──────────────────────────────────────────────

/**
 * 5問を選んで返す
 *
 * @param {Array}  quizData       - 全格言データ（各要素に id が必要）
 * @param {object} questionStats  - { [questionId]: questionStat }
 * @param {Date}   now            - 現在時刻（省略時は new Date()）
 * @returns {{
 *   questions: Array,           - 選ばれた問題（最大5問）
 *   debug: {
 *     pools: object,            - 各優先度プールのサイズ
 *     composition: object,      - 選ばれた問題の内訳
 *   }
 * }}
 *
 * @example
 * import { selectQuestions } from './lib/selectQuestions'
 * import { quizData }        from './data/quizData'
 *
 * const { questions, debug } = selectQuestions(quizData, progress.questionStats)
 * console.log(questions.map(q => q.id))
 * console.table(debug.pools)
 */
export function selectQuestions(quizData, questionStats, now = new Date()) {
  const nowMs      = now.getTime()
  const todayEndMs = _todayEnd(now).getTime()

  // ── 分類 ──
  const overdue   = []   // 優先度1: 期限切れ復習
  const demoted   = []   // 優先度2: 降格カード
  const todayRev  = []   // 優先度3: 当日復習
  const newCards  = []   // 優先度4: 新規
  const longTerm  = []   // 優先度5: MASTERED 長期確認

  for (const q of quizData) {
    const stat   = _getStat(q.id, questionStats)
    const level  = stat.memory_level
    const nextMs = stat.next_review   ? new Date(stat.next_review).getTime()   : null
    const lastMs = stat.last_reviewed ? new Date(stat.last_reviewed).getTime() : null

    // ── 新規 ──
    if (level === 0) {
      newCards.push(q)
      continue
    }

    // ── MASTERED 長期確認 ──
    if (level === MASTERED_LEVEL) {
      if (nextMs !== null && nextMs <= nowMs) {
        longTerm.push(q)
      }
      continue
    }

    // ── 期限切れ or 降格カード ──
    if (nextMs !== null && nextMs <= nowMs) {
      // 降格カード: was_demoted かつ last_reviewed が直近24時間以内
      const isDemoted =
        stat.was_demoted &&
        lastMs !== null &&
        (nowMs - lastMs) <= DEMOTE_WINDOW_MS

      if (isDemoted) {
        demoted.push(q)
      } else {
        overdue.push(q)
      }
      continue
    }

    // ── 当日復習 ──
    if (nextMs !== null && nextMs <= todayEndMs) {
      todayRev.push(q)
    }
  }

  // ── ソート ──

  // 優先度1: next_review が古い順（長く放置されているものが先）
  overdue.sort((a, b) =>
    _nextMs(a.id, questionStats) - _nextMs(b.id, questionStats)
  )

  // 優先度2: last_reviewed が新しい順（直近に間違えたものが先）
  demoted.sort((a, b) =>
    _lastMs(b.id, questionStats) - _lastMs(a.id, questionStats)
  )

  // 優先度3: next_review が早い順
  todayRev.sort((a, b) =>
    _nextMs(a.id, questionStats) - _nextMs(b.id, questionStats)
  )

  // 優先度4: id 昇順（格言番号順）
  newCards.sort((a, b) => a.id - b.id)

  // 優先度5: next_review が古い順
  longTerm.sort((a, b) =>
    _nextMs(a.id, questionStats) - _nextMs(b.id, questionStats)
  )

  // ── 5問選択 ──
  const reviewPool = [...overdue, ...demoted, ...todayRev]

  let selected = reviewPool.slice(0, TOTAL)

  // 復習が不足 → 新規で補完
  if (selected.length < TOTAL) {
    const need = TOTAL - selected.length
    selected = [...selected, ...newCards.slice(0, need)]
  }

  // まだ足りない → 長期確認で補完
  if (selected.length < TOTAL) {
    const need = TOTAL - selected.length
    selected = [...selected, ...longTerm.slice(0, need)]
  }

  // ── デバッグ情報 ──
  const poolSizes = {
    overdue:  overdue.length,
    demoted:  demoted.length,
    todayRev: todayRev.length,
    newCards: newCards.length,
    longTerm: longTerm.length,
  }

  const composition = _countComposition(selected, overdue, demoted, todayRev, newCards, longTerm)

  return {
    questions: selected,
    debug: { pools: poolSizes, composition },
  }
}

// ──────────────────────────────────────────────
//  内部ヘルパー
// ──────────────────────────────────────────────

function _getStat(id, questionStats) {
  return { ...defaultQStat(), ...(questionStats[id] ?? {}) }
}

function _nextMs(id, questionStats) {
  const nr = questionStats[id]?.next_review
  return nr ? new Date(nr).getTime() : 0
}

function _lastMs(id, questionStats) {
  const lr = questionStats[id]?.last_reviewed
  return lr ? new Date(lr).getTime() : 0
}

function _todayEnd(now) {
  const d = new Date(now)
  d.setHours(23, 59, 59, 999)
  return d
}

function _countComposition(selected, overdue, demoted, todayRev, newCards, longTerm) {
  const overdueSet  = new Set(overdue.map(q => q.id))
  const demotedSet  = new Set(demoted.map(q => q.id))
  const todaySet    = new Set(todayRev.map(q => q.id))
  const newSet      = new Set(newCards.map(q => q.id))
  const longSet     = new Set(longTerm.map(q => q.id))

  const counts = { overdue: 0, demoted: 0, todayRev: 0, newCards: 0, longTerm: 0 }
  for (const q of selected) {
    if (overdueSet.has(q.id))     counts.overdue++
    else if (demotedSet.has(q.id)) counts.demoted++
    else if (todaySet.has(q.id))   counts.todayRev++
    else if (newSet.has(q.id))     counts.newCards++
    else if (longSet.has(q.id))    counts.longTerm++
  }
  return counts
}
