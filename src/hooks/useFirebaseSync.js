import { useState, useEffect, useRef, useCallback } from 'react'
import { initAuth, syncUserScore } from '../lib/firebaseSync'

/**
 * Firebase匿名Auth + Firestoreスコア同期フック
 *
 * - マウント時に signInAnonymously を実行してUIDを取得
 * - syncProgress(progress) を呼ぶと Firestore に保存
 * - totalAnswered や streak が変化した後1秒のデバウンスで自動同期
 */
export function useFirebaseSync(progress) {
  const [uid,    setUid]    = useState(null)
  const [synced, setSynced] = useState(false)   // 初回同期済みフラグ
  const debounceRef = useRef(null)

  // ── アプリ起動時に匿名ログイン ──────────────────────────
  useEffect(() => {
    initAuth().then(u => {
      if (u) setUid(u)
    })
  }, [])

  // ── 手動同期（クイズ完了後などに呼ぶ） ─────────────────
  const syncProgress = useCallback(async (latestProgress) => {
    if (!uid) return
    await syncUserScore(uid, latestProgress)
    setSynced(true)
  }, [uid])

  // ── progress 変化を検知して自動同期（デバウンス1秒） ───
  useEffect(() => {
    if (!uid || !progress) return
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      syncUserScore(uid, progress)
        .then(() => setSynced(true))
        .catch(() => {})
    }, 1000)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  // totalAnswered・streak が変わったときのみ再同期
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, progress?.totalAnswered, progress?.streak, progress?.questionStats])

  return { uid, synced, syncProgress }
}
