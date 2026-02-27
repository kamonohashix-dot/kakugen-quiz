import {
  doc, collection, setDoc,
  serverTimestamp, increment,
  onSnapshot, query, orderBy, limit,
} from 'firebase/firestore'
import { db } from './firebase'

// ── 名寄せマッピング（入力テキスト → canonical key） ──────
export const KEYWORD_MAP = {
  // バフェット関連
  'ウォーレン':              'buffett',
  'バフェット':              'buffett',
  'オマハ':                  'buffett',
  'ウォーレン・バフェット':  'buffett',

  // グレアム
  'グレアム':                'graham',
  'ベンジャミン・グレアム':  'graham',
  'ベンジャミン':            'graham',

  // テンプルトン
  'テンプルトン':            'templeton',
  'ジョン・テンプルトン':    'templeton',

  // リンチ
  'リンチ':                  'lynch',
  'ピーター・リンチ':        'lynch',

  // リバモア
  'リバモア':                'livermore',
  'ジェシー・リバモア':      'livermore',
  'ジェシー':                'livermore',

  // 千利休
  '千利休':                  'rikyu',
  '利休':                    'rikyu',
  '日本の相場格言（千利休）': 'rikyu',

  // シーゲル
  'シーゲル':                'siegel',
  'ジェレミー・シーゲル':    'siegel',

  // フィッシャー
  'フィリップ・フィッシャー': 'philfisher',
  'ケン・フィッシャー':       'kenfisher',

  // アインシュタイン
  'アインシュタイン':              'einstein',
  'アルバート・アインシュタイン':  'einstein',

  // カテゴリ系
  '日本の相場格言': 'japan',
  '日本のことわざ': 'japan',
  'ウォール街の格言': 'wallstreet',
  'ウォール街':     'wallstreet',
  '西洋のことわざ': 'western',
}

// canonical key → 表示ラベル
const KEYWORD_DISPLAY = {
  buffett:    'バフェット',
  graham:     'グレアム',
  templeton:  'テンプルトン',
  lynch:      'ピーター・リンチ',
  livermore:  'リバモア',
  rikyu:      '千利休',
  siegel:     'シーゲル',
  philfisher: 'フィリップ・フィッシャー',
  kenfisher:  'ケン・フィッシャー',
  einstein:   'アインシュタイン',
  japan:      '日本の相場格言',
  wallstreet: 'ウォール街の格言',
  western:    '西洋のことわざ',
}

// ── テキストを canonical key に解決 ────────────────────────
export function resolveKeyword(text) {
  if (!text) return null
  const t = text.trim()
  // 完全一致を先に試みる
  if (KEYWORD_MAP[t]) {
    const key = KEYWORD_MAP[t]
    return { key, label: KEYWORD_DISPLAY[key] ?? t }
  }
  // 部分一致（入力がマッピングキーを含む）
  for (const [mapKey, canonical] of Object.entries(KEYWORD_MAP)) {
    if (t.includes(mapKey)) {
      return { key: canonical, label: KEYWORD_DISPLAY[canonical] ?? mapKey }
    }
  }
  return null
}

// ── Firestore にキーワードを記録（increment） ───────────────
export async function recordKeyword(text) {
  const resolved = resolveKeyword(text)
  if (!resolved) return
  try {
    await setDoc(
      doc(db, 'trending_keywords', resolved.key),
      {
        keyword:   resolved.label,
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
