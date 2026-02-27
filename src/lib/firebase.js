import { initializeApp } from 'firebase/app'
import { getFirestore }  from 'firebase/firestore'
import { getAuth }       from 'firebase/auth'
import { getAnalytics }  from 'firebase/analytics'

// ── Firebase プロジェクト設定 ──────────────────────────────
const firebaseConfig = {
  apiKey:            'AIzaSyDFI2_xWqiu2It6k38BL1KVbmY0TXEqva0',
  authDomain:        'kabukakugen-plus.firebaseapp.com',
  projectId:         'kabukakugen-plus',
  storageBucket:     'kabukakugen-plus.firebasestorage.app',
  messagingSenderId: '1028803928536',
  appId:             '1:1028803928536:web:25fa8f1d53a32dc0a4d2ad',
  measurementId:     'G-JKW86NF2RQ',
}

// ── 初期化 ────────────────────────────────────────────────
const app       = initializeApp(firebaseConfig)
export const db = getFirestore(app)   // Firestore（スコア集計・ランキング用）
export const auth = getAuth(app)      // Auth（匿名ログイン・名寄せ用）

// Analytics はブラウザ環境のみ有効化
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null

export default app
