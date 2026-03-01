import { signInAnonymously } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'
import { calcScore, getTitle, TITLES } from './calcScore'
import { getLoginTitle } from './expSystem'
import { quizData } from '../data/quizData'

// ── 匿名ログイン ────────────────────────────────────────────
export async function initAuth() {
  try {
    const { user } = await signInAnonymously(auth)
    return user.uid
  } catch (e) {
    console.warn('[Firebase] Auth error:', e)
    return null
  }
}

// ── Firestore にスコア・称号を保存 ──────────────────────────
// level: 0（株初心者）〜 9（伝説の相場師）
export async function syncUserScore(uid, progress) {
  if (!uid) return

  const totalQuestions = quizData.length
  const s     = calcScore(progress, totalQuestions)
  const title = getTitle(s.total)

  // TITLES は降順（90→0）なので最初にマッチしたインデックスを反転してレベル化
  const titleIdx = TITLES.findIndex(t => s.total >= t.min)
  const level    = TITLES.length - 1 - (titleIdx >= 0 ? titleIdx : TITLES.length - 1)

  const consecutiveClearDays = progress.consecutiveClearDays ?? 0
  const loginTitleInfo       = getLoginTitle(consecutiveClearDays)

  const payload = {
    // 既存スコア
    score:        parseFloat(s.total.toFixed(1)),
    title:        title.name,
    titleIcon:    title.icon,
    level,
    experience:   progress.totalAnswered ?? 0,
    masteredCount: s.masteredCount,
    accuracy:     s.accuracy,
    streak:       progress.streak        ?? 0,
    // 経験値・レベルシステム
    expLevel:     progress.level         ?? 1,
    exp:          progress.exp           ?? 0,
    // 連続デイリークリア
    consecutiveClearDays,
    loginTitle:   loginTitleInfo.name,
    loginTitleIcon: loginTitleInfo.icon,
    updatedAt:    serverTimestamp(),
  }

  try {
    await setDoc(doc(db, 'users', uid), payload, { merge: true })
  } catch (e) {
    console.warn('[Firebase] Firestore sync error:', e)
  }
}
