/**
 * 経験値・レベルシステム
 *
 * レベル計算式: level = max(1, min(99, floor(sqrt(totalExp / 5))))
 * Lv.N に到達するための累計経験値 = N * N * 5
 *   例: Lv.12 → 12*12*5=720, Lv.99 → 99*99*5=49,005
 *
 * 経験値獲得:
 *   正解               +10
 *   不正解             +2
 *   3問連続正解ボーナス +5
 *   全問正解（完璧）   +20
 *   デイリークイズ完了 +15
 */

export const MAX_LEVEL = 99

/** 累計経験値からレベルを算出 (min:1, max:99) */
export function getLevelFromExp(totalExp) {
  const n = Math.floor(Math.sqrt(Math.max(0, totalExp) / 5))
  return Math.max(1, Math.min(MAX_LEVEL, n))
}

/**
 * レベルNの開始累計経験値
 *   Lv.1 = 0（スタート地点）
 *   Lv.N = N*N*5 (N >= 2)
 */
export function getLevelThreshold(level) {
  if (level <= 1) return 0
  return level * level * 5
}

/** 次レベルに到達するための累計経験値（Lv.99の場合はnull） */
export function getNextLevelThreshold(level) {
  if (level >= MAX_LEVEL) return null
  return (level + 1) * (level + 1) * 5
}

/**
 * カテゴリレベル（50XPごとに1段階、上限30）
 *   2000問設計でも上限30が適切な難度になるように調整
 */
export function getCategoryLevel(categoryExp) {
  return Math.max(1, Math.min(30, Math.floor(Math.max(0, categoryExp) / 50) + 1))
}

// ── 連続デイリークリア称号 ──────────────────────────────────

export const LOGIN_TITLES = [
  { min: 90, name: '伝説の相場師',        icon: '👑' },
  { min: 60, name: 'ウォール街の住人',     icon: '🐉' },
  { min: 30, name: 'ファンドマネージャー', icon: '🦁' },
  { min: 14, name: 'トレーダー',           icon: '🦊' },
  { min: 7,  name: '個人投資家',           icon: '🐥' },
  { min: 1,  name: '投資見習い',           icon: '🐣' },
  { min: 0,  name: '—',                    icon: '🥚' },
]

export function getLoginTitle(days) {
  return LOGIN_TITLES.find(t => days >= t.min) ?? LOGIN_TITLES[LOGIN_TITLES.length - 1]
}

// ── セッション経験値計算 ──────────────────────────────────────

/**
 * セッションで獲得する経験値を計算する
 *
 * @param {Array<{ correct: boolean }>} answers - 回答配列（順序通り）
 * @param {boolean} isPerfect - 全問正解フラグ
 * @param {boolean} isDaily   - ランダム5問モード（デイリークイズ）フラグ
 * @returns {{ total: number, breakdown: object }}
 */
export function calcSessionXP(answers, isPerfect, isDaily) {
  let total  = 0
  let streak = 0
  const breakdown = { correct: 0, wrong: 0, streakBonus: 0, perfect: 0, daily: 0 }

  for (const a of answers) {
    if (a.correct) {
      total += 10
      breakdown.correct += 10
      streak++
      if (streak % 3 === 0) {
        total += 5
        breakdown.streakBonus += 5
      }
    } else {
      total += 2
      breakdown.wrong += 2
      streak = 0
    }
  }

  if (isPerfect && answers.length > 0) {
    total += 20
    breakdown.perfect = 20
  }
  if (isDaily) {
    total += 15
    breakdown.daily = 15
  }

  return { total, breakdown }
}
