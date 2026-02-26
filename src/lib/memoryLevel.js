/**
 * 忘却曲線に基づく記憶レベル管理ロジック
 *
 * memory_level の意味:
 *   0 = 未学習
 *   1 = 初回正解  → 4時間後に復習
 *   2 = 2回目正解 → 1日後に復習
 *   3 = 3回目正解 → 3日後に復習
 *   4 = 4回目正解 → 7日後に復習
 *   5 = 5回目正解 → 14日後に復習
 *   6 = 6回目正解 → 30日後に復習
 *   7 = MASTERED  → 90日後に最終確認
 */

export const MASTERED_LEVEL = 7

// 各レベルの復習間隔（ミリ秒）
export const LEVEL_INTERVALS_MS = {
  1: 4  * 60 * 60 * 1000,          //  4時間
  2: 24 * 60 * 60 * 1000,          //  1日
  3:  3 * 24 * 60 * 60 * 1000,     //  3日
  4:  7 * 24 * 60 * 60 * 1000,     //  7日
  5: 14 * 24 * 60 * 60 * 1000,     // 14日
  6: 30 * 24 * 60 * 60 * 1000,     // 30日
  7: 90 * 24 * 60 * 60 * 1000,     // 90日（MASTERED 最終確認）
}

// 各レベルの人間向けラベル
export const LEVEL_LABELS = {
  0: '未学習',
  1: '初回正解',
  2: '2回目正解',
  3: '3回目正解',
  4: '4回目正解',
  5: '5回目正解',
  6: '6回目正解',
  7: 'MASTERED',
}

// 不正解時の降格先テーブル
//   level 0 は未学習なのでそのまま（降格なし）
export const DEMOTION_TABLE = {
  0: 0,
  1: 0,
  2: 1,
  3: 1,
  4: 2,
  5: 3,
  6: 4,
  7: 5,
}

// ──────────────────────────────────────────────
//  questionStats の1エントリのデフォルト値
// ──────────────────────────────────────────────

export function defaultQStat() {
  return {
    memory_level:        0,
    next_review:         null,   // ISO 文字列 or null
    last_reviewed:       null,   // ISO 文字列 or null
    correct_count:       0,
    wrong_count:         0,
    consecutive_correct: 0,
    mastered_date:       null,   // ISO 文字列 or null
    was_demoted:         false,  // 出題アルゴリズムで降格カードを識別するフラグ
  }
}

// ──────────────────────────────────────────────
//  内部ヘルパー
// ──────────────────────────────────────────────

function calcNextReview(level, now) {
  const ms = LEVEL_INTERVALS_MS[level]
  if (!ms) return null
  return new Date(now.getTime() + ms).toISOString()
}

// ──────────────────────────────────────────────
//  正解処理
// ──────────────────────────────────────────────

/**
 * 正解した場合の stat を計算して返す（元 stat は変更しない）
 *
 * @param {object} stat - 現在の questionStat
 * @param {Date}   now  - 現在時刻（省略時は new Date()）
 * @returns {object} 更新後の stat
 */
export function applyCorrect(stat, now = new Date()) {
  const nowISO  = now.toISOString()
  const newLevel = Math.min(stat.memory_level + 1, MASTERED_LEVEL)

  return {
    ...stat,
    memory_level:        newLevel,
    next_review:         calcNextReview(newLevel, now),
    correct_count:       stat.correct_count + 1,
    consecutive_correct: stat.consecutive_correct + 1,
    last_reviewed:       nowISO,
    // level 7 に初めて到達した瞬間だけ mastered_date を記録
    mastered_date:       newLevel === MASTERED_LEVEL && !stat.mastered_date
                           ? nowISO
                           : stat.mastered_date,
    was_demoted:         false,
  }
}

// ──────────────────────────────────────────────
//  不正解処理
// ──────────────────────────────────────────────

/**
 * 不正解の場合の stat を計算して返す（元 stat は変更しない）
 *
 * @param {object} stat - 現在の questionStat
 * @param {Date}   now  - 現在時刻（省略時は new Date()）
 * @returns {object} 更新後の stat
 */
export function applyWrong(stat, now = new Date()) {
  const nowISO       = now.toISOString()
  const demotedLevel = DEMOTION_TABLE[stat.memory_level] ?? 0

  return {
    ...stat,
    memory_level:        demotedLevel,
    next_review:         calcNextReview(demotedLevel, now),
    wrong_count:         stat.wrong_count + 1,
    consecutive_correct: 0,
    last_reviewed:       nowISO,
    mastered_date:       null,    // MASTERED 取り消し
    // 実際にレベルが下がったときだけフラグを立てる（level 0 → 0 は false）
    was_demoted:         stat.memory_level !== demotedLevel,
  }
}

// ──────────────────────────────────────────────
//  テスト用シミュレーション
// ──────────────────────────────────────────────

/**
 * 一連の正解・不正解をシミュレートして、各ステップの stat を追跡する
 *
 * @param {Array<{ correct: boolean, now?: string }>} answers
 *   correct: 正解なら true
 *   now:     任意。指定すると「その時刻に回答した」として計算する（ISO 文字列）
 * @param {object|null} initialStat - 初期 stat（省略時はデフォルト）
 * @returns {{ stat: object, history: Array }}
 *
 * @example
 * // 連続正解でレベルが上がるか確認
 * simulateAnswers([
 *   { correct: true },
 *   { correct: true },
 *   { correct: false },
 *   { correct: true },
 * ])
 *
 * @example
 * // 日時を指定して間隔を確認
 * simulateAnswers([
 *   { correct: true,  now: '2025-01-01T09:00:00Z' },
 *   { correct: true,  now: '2025-01-01T14:00:00Z' },  // 5時間後（level1の4時間後なのでOK）
 *   { correct: false, now: '2025-01-02T10:00:00Z' },  // 翌日
 * ])
 */
export function simulateAnswers(answers, initialStat = null) {
  let stat = { ...defaultQStat(), ...(initialStat ?? {}) }

  const history = [
    { step: 0, action: 'initial', ...stat },
  ]

  for (let i = 0; i < answers.length; i++) {
    const { correct, now } = answers[i]
    const date = now ? new Date(now) : new Date()
    stat = correct ? applyCorrect(stat, date) : applyWrong(stat, date)
    history.push({ step: i + 1, action: correct ? '⭕ 正解' : '❌ 不正解', ...stat })
  }

  return { stat, history }
}

/**
 * 各レベルごとに「正解したらどうなるか」「不正解だとどうなるか」を一覧表示する
 * ブラウザのコンソールで呼び出して確認できる
 *
 * @example
 * import { printLevelTable } from './lib/memoryLevel'
 * printLevelTable()
 */
export function printLevelTable() {
  const now = new Date('2025-01-01T12:00:00Z')

  console.table(
    Array.from({ length: 8 }, (_, level) => {
      const stat = { ...defaultQStat(), memory_level: level }
      const afterCorrect = applyCorrect(stat, now)
      const afterWrong   = applyWrong(stat, now)

      return {
        'level（前）':      level,
        '状態':             LEVEL_LABELS[level],
        '正解→level':       afterCorrect.memory_level,
        '正解→次回復習':     afterCorrect.next_review?.slice(0, 16).replace('T', ' ') ?? '—',
        '不正解→level':     afterWrong.memory_level,
        '不正解→次回復習':   afterWrong.next_review?.slice(0, 16).replace('T', ' ') ?? '—',
        '不正解→降格?':     afterWrong.was_demoted ? 'Yes' : 'No',
      }
    })
  )
}
