import { useState, useMemo } from 'react'
import { quizData, CATEGORIES } from '../data/quizData'
import { MASTERED_LEVEL } from '../lib/memoryLevel'

// 著者名の正規化（括弧を除去）
const normAuthor = (a) => a.replace(/（[^）]*）/, '').trim()

// 記憶レベルに対応する色
const LEVEL_COLORS = [
  '#BDBDBD', // 0: 未学習
  '#9B59B6', // 1
  '#3498DB', // 2
  '#1ABC9C', // 3
  '#27AE60', // 4
  '#F39C12', // 5
  '#FF6B35', // 6
  '#FFD700', // 7: MASTERED
]

export default function SearchScreen({ progress }) {
  const [selectedAuthor, setSelectedAuthor] = useState(null) // null = 全て
  const [searchText,     setSearchText]     = useState('')

  const { questionStats = {} } = progress

  // ユニーク著者リスト（正規化済み）
  const uniqueAuthors = useMemo(() =>
    ['全て', ...new Set(quizData.map(q => normAuthor(q.author)))]
  , [])

  // フィルタリング
  const filtered = useMemo(() => {
    const text = searchText.trim()
    return quizData.filter(q => {
      const matchAuthor = !selectedAuthor || normAuthor(q.author) === selectedAuthor
      const matchText   = !text || q.quote.includes(text) || q.author.includes(text) || q.category.includes(text)
      return matchAuthor && matchText
    })
  }, [selectedAuthor, searchText])

  return (
    <div className="search-screen">

      {/* ─── 固定ヘッダー（検索バー＋著者チップ） ─── */}
      <div className="search-sticky">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="格言・人物名・カテゴリで検索…"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="search-input"
          />
          {searchText && (
            <button className="search-clear" onClick={() => setSearchText('')}>✕</button>
          )}
        </div>

        <div className="search-author-chips">
          {uniqueAuthors.map(author => {
            const isAll  = author === '全て'
            const active = isAll ? !selectedAuthor : selectedAuthor === author
            const count  = isAll
              ? quizData.length
              : quizData.filter(q => normAuthor(q.author) === author).length
            return (
              <button
                key={author}
                className={`search-author-chip${active ? ' search-author-chip--active' : ''}`}
                onClick={() => setSelectedAuthor(isAll ? null : author)}
              >
                {author}
                <span className="search-chip-count">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── 検索結果 ─── */}
      <div className="search-results">
        <div className="search-results-count">{filtered.length}件</div>

        {filtered.map(q => {
          const stat     = questionStats[q.id]
          const level    = stat?.memory_level ?? 0
          const answered = (stat?.correct_count ?? 0) + (stat?.wrong_count ?? 0)
          const mastered = level >= MASTERED_LEVEL
          const cat      = CATEGORIES.find(c => c.name === q.category)

          return (
            <div
              key={q.id}
              className={`search-quote-card${mastered ? ' search-quote-card--mastered' : ''}`}
            >
              <div className="search-quote-meta">
                <span className="search-quote-cat" style={{ background: cat?.color ?? '#aaa' }}>
                  {cat?.icon} {q.category}
                </span>
                {mastered && (
                  <span className="search-quote-mastered-badge">MASTERED</span>
                )}
                {answered > 0 && !mastered && (
                  <span
                    className="search-quote-level"
                    style={{ color: LEVEL_COLORS[level] }}
                  >
                    Lv.{level}
                  </span>
                )}
              </div>

              <div className="search-quote-text">「{q.quote}」</div>
              <div className="search-quote-author">— {q.author}</div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="search-empty">
            <div className="search-empty-icon">🔍</div>
            <div>該当する格言が見つかりません</div>
          </div>
        )}
      </div>

    </div>
  )
}
