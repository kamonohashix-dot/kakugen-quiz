import {
  doc, collection, setDoc,
  serverTimestamp, increment,
  onSnapshot, query, orderBy, limit,
} from 'firebase/firestore'
import { db } from './firebase'

// ── 名寄せマッピング（入力テキスト → 代表語） ───────────────
// 値はFirestoreのdocIDと表示ラベルを兼ねた日本語代表語
const ALIAS_MAP = {
  // バフェット関連
  'ウォーレン':              'バフェット',
  'バフェット':              'バフェット',
  'オマハ':                  'バフェット',
  'ウォーレン・バフェット':  'バフェット',

  // グレアム
  'グレアム':                'グレアム',
  'ベンジャミン・グレアム':  'グレアム',
  'ベンジャミン':            'グレアム',

  // テンプルトン
  'テンプルトン':            'テンプルトン',
  'ジョン・テンプルトン':    'テンプルトン',

  // リンチ
  'リンチ':                  'ピーター・リンチ',
  'ピーター・リンチ':        'ピーター・リンチ',
  'ピーター':                'ピーター・リンチ',

  // リバモア
  'リバモア':                'リバモア',
  'ジェシー・リバモア':      'リバモア',
  'ジェシー':                'リバモア',

  // 千利休
  '千利休':                  '千利休',
  '利休':                    '千利休',

  // シーゲル
  'シーゲル':                'シーゲル',
  'ジェレミー・シーゲル':    'シーゲル',

  // フィッシャー
  'フィリップ・フィッシャー': 'フィリップ・フィッシャー',
  'ケン・フィッシャー':       'ケン・フィッシャー',
  'フィッシャー':             'ケン・フィッシャー',

  // アインシュタイン
  'アインシュタイン':              'アインシュタイン',
  'アルバート・アインシュタイン':  'アインシュタイン',
}

// ── 入力を代表語に解決（名寄せ） ─────────────────────────────
// 一致すれば代表語、しなければ null を返す
export function resolveKeyword(text) {
  if (!text) return null
  const t = text.trim()
  if (ALIAS_MAP[t]) return ALIAS_MAP[t]
  // 部分一致（例：「バフェット名言」→「バフェット」）
  for (const [alias, canonical] of Object.entries(ALIAS_MAP)) {
    if (t.includes(alias)) return canonical
  }
  return null
}

// ── Firestore にキーワードを記録 ──────────────────────────────
// ・名寄せあり → 代表語をdocIDに使用（例: 'ウォーレン' → 'バフェット'）
// ・名寄せなし → 入力そのままをdocIDに使用（例: 'ナイフ'）
export async function recordKeyword(text) {
  const t = text?.trim()
  if (!t || t.length < 2) return

  const canonical = resolveKeyword(t) ?? t
  // Firestoreで使えないスラッシュだけ除去
  const docId = canonical.replace(/\//g, '')

  try {
    await setDoc(
      doc(db, 'trending_keywords', docId),
      {
        keyword:   canonical,
        count:     increment(1),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
  } catch (e) {
    console.warn('[Trending] write error:', e)
  }
}

// ── count 降順で上位10件をリアルタイム購読 ─────────────────
export function subscribeTrends(callback) {
  const q = query(
    collection(db, 'trending_keywords'),
    orderBy('count', 'desc'),
    limit(10)
  )
  return onSnapshot(
    q,
    snapshot => {
      callback(
        snapshot.docs.map(d => ({
          id:      d.id,
          keyword: d.data().keyword ?? d.id,
          count:   d.data().count   ?? 0,
        }))
      )
    },
    err => console.warn('[Trending] snapshot error:', err)
  )
}
