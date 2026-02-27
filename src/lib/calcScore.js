import { MASTERED_LEVEL } from './memoryLevel'

// ─── 称号テーブル ─────────────────────────────────────────────
export const TITLES = [
  { min: 90, name: '伝説の相場師',       icon: '🐉', top: '上位1%'  },
  { min: 80, name: '格言マスター',       icon: '👑', top: '上位3%'  },
  { min: 70, name: 'ウォール街の猛者',   icon: '🦅', top: '上位5%'  },
  { min: 60, name: '兜町の賢者',         icon: '🦉', top: '上位15%' },
  { min: 50, name: '相場の語り部',       icon: '🏯', top: '上位30%' },
  { min: 40, name: '格言トレーダー',     icon: '📈', top: '上位50%' },
  { min: 30, name: '一人前の投資家',     icon: '💹', top: '上位70%' },
  { min: 20, name: '駆け出しトレーダー', icon: '📊', top: '上位85%' },
  { min: 10, name: '見習い投資家',       icon: '🌱', top: '上位95%' },
  { min: 0,  name: '株初心者',           icon: '🥚', top: '—'       },
]

// ─── ストリーク補正テーブル ───────────────────────────────────
const STREAK_TABLE = [
  { min: 60, pts: 15 },
  { min: 30, pts: 12 },
  { min: 14, pts: 9  },
  { min: 7,  pts: 6  },
  { min: 1,  pts: 3  },
  { min: 0,  pts: 0  },
]

// ─── 連続パーフェクトの達成段階 ──────────────────────────────
export const PERFECT_STAGES = [
  { count: 1,  name: 'パーフェクト！',       emoji: '🎯' },
  { count: 3,  name: 'トリプルパーフェクト', emoji: '✨' },
  { count: 5,  name: 'ゴッドハンド',         emoji: '⚡' },
  { count: 10, name: '無敗の相場師',         emoji: '🔥' },
  { count: 30, name: '相場の神',             emoji: '👁️' },
]

// ─── スコア計算 ───────────────────────────────────────────────
/**
 * 格言力スコア（0〜100）を計算する
 * A = (MASTERED枚数 / 全問数) × 40
 * B = 全体正答率 × 30
 * C = ストリーク補正（0〜15）
 * D = 復習遵守率 × 15
 */
export function calcScore(progress, totalQuestions) {
  const {
    totalAnswered   = 0,
    totalCorrect    = 0,
    streak          = 0,
    questionStats   = {},
    reviewsDue      = 0,
    reviewsComplied = 0,
  } = progress

  const masteredCount = Object.values(questionStats)
    .filter(s => (s.memory_level ?? 0) >= MASTERED_LEVEL).length

  const denom = totalQuestions > 0 ? totalQuestions : 1
  const A = (masteredCount / denom) * 40
  const B = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 30 : 0
  const C = STREAK_TABLE.find(t => streak >= t.min)?.pts ?? 0
  const D = reviewsDue > 0 ? (reviewsComplied / reviewsDue) * 15 : 0

  const total = parseFloat(Math.min(A + B + C + D, 100).toFixed(1))

  return {
    total,
    A: parseFloat(A.toFixed(1)),
    B: parseFloat(B.toFixed(1)),
    C: parseFloat(C.toFixed(1)),
    D: parseFloat(D.toFixed(1)),
    masteredCount,
    accuracy:       totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
    complianceRate: reviewsDue    > 0 ? Math.round((reviewsComplied / reviewsDue)  * 100) : 0,
  }
}

// ─── 称号ヘルパー ─────────────────────────────────────────────
export function getTitle(score) {
  return TITLES.find(t => score >= t.min) ?? TITLES[TITLES.length - 1]
}

export function getNextTitle(score) {
  const idx = TITLES.findIndex(t => score >= t.min)
  return idx > 0 ? TITLES[idx - 1] : null
}

export function getNextPerfectStage(count) {
  return PERFECT_STAGES.find(s => s.count > count) ?? null
}
