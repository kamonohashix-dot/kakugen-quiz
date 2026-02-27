import { useState, useMemo, useEffect, useRef } from 'react'
import { quizData, CATEGORIES } from '../data/quizData'
import { MASTERED_LEVEL } from '../lib/memoryLevel'
import { recordKeyword, subscribeTrends } from '../lib/trendingKeywords'

// 著者名の正規化（括弧を除去）
const normAuthor = (a) => a.replace(/（[^）]*）/, '').trim()

// 記憶レベルに対応する色
const LEVEL_COLORS = [
  '#BDBDBD', '#9B59B6', '#3498DB', '#1ABC9C',
  '#27AE60', '#F39C12', '#FF6B35', '#FFD700',
]

export default function SearchScreen({ progress }) {
  const [selectedAuthor, setSelectedAuthor] = useState(null)
  const [searchText,     setSearchText]     = useState('')
  const [trends,         setTrends]         = useState([])
  const searchDebounceRef = useRef(null)

  const { questionStats = {} } = progress

  // ── リアルタイムトレンド購読 ──────────────────────────────
  useEffect(() => {
    const unsubscribe = subscribeTrends(setTrends)
    return () => unsubscribe()
  }, [])

  // ── ユニーク著者リスト ────────────────────────────────────
  const uniqueAuthors = useMemo(() =>
    ['全て', ...new Set(quizData.map(q => normAuthor(q.author)))]
  , [])

  // ── フィルタリング ────────────────────────────────────────
  const filtered = useMemo(() => {
    const text = searchText.trim()
    return quizData.filter(q => {
      const matchAuthor = !selectedAuthor || normAuthor(q.author) === selectedAuthor
      const matchText   = !text ||
        q.quote.includes(text) || q.author.includes(text) || q.category.includes(text)
      return matchAuthor && matchText
    })
  }, [selectedAuthor, searchText])

  // アイドル状態（何も検索・フィルターしていない）
  const isIdle       = !searchText.trim() && !selectedAuthor
  const showTrends   = isIdle && trends.length > 0
  const showResults  = !isIdle

  // ── 検索テキスト変更（1.5秒デバウンスで記録） ────────────
  const handleSearchChange = (e) => {
    const text = e.target.value
    setSearchText(text)
    setSelectedAuthor(null)

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    if (text.trim().length >= 2) {
      searchDebounceRef.current = setTimeout(() => {
        recordKeyword(text.trim())
      }, 1500)
    }
  }

  // ── 著者チップ選択 ─────────────────────────────────────────
  const handleChipClick = (author) => {
    const isAll = author === '全て'
    setSelectedAuthor(isAll ? null : author)
    setSearchText('')
    if (!isAll) recordKeyword(author)
  }

  // ── トレンドチップ選択 ────────────────────────────────────
  const handleTrendingClick = (trend) => {
    setSelectedAuthor(null)
    setSearchText(trend.keyword)
    recordKeyword(trend.keyword)
  }

  return (
    <div className="search-screen">

      {/* ─── 固定ヘッダー ─── */}
      <div className="search-sticky">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="格言・人物名・カテゴリで検索…"
            value={searchText}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchText && (
            <button className="search-clear" onClick={() => { setSearchText(''); setSelectedAuthor(null) }}>✕</button>
          )}
        </div>

        <div className="search-author-chips">
          {uniqueAuthors.map(author => {
            const isAll  = author === '全て'
            const active = isAll ? !selectedAuthor && !searchText : selectedAuthor === author
            return (
              <button
                key={author}
                className={`search-author-chip${active ? ' search-author-chip--active' : ''}`}
                onClick={() => handleChipClick(author)}
              >
                {author}
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── トレンドセクション（アイドル時） ─── */}
      {showTrends && (
        <div className="trending-section">
          <div className="trending-header">
            <span className="trending-title">🔥 みんなの人気ワード</span>
            <span className="trending-sub">リアルタイム集計</span>
          </div>
          <div className="trending-chips">
            {trends.map((t, i) => (
              <button
                key={t.id}
                className="trending-chip"
                onClick={() => handleTrendingClick(t)}
              >
                <span className="trending-rank">#{i + 1}</span>
                <span className="trending-keyword">{t.keyword}</span>
                <span className="trending-count">🔥{t.count.toLocaleString()}</span>
              </button>
            ))}
          </div>

          <div className="trending-hint">
            タップして格言を絞り込もう
          </div>
        </div>
      )}

      {/* ─── 検索・フィルター結果 ─── */}
      {showResults && (
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
                  {mastered && <span className="search-quote-mastered-badge">MASTERED</span>}
                  {answered > 0 && !mastered && (
                    <span className="search-quote-level" style={{ color: LEVEL_COLORS[level] }}>
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
      )}

      {/* アイドル時の説明 */}
      {isIdle && !showTrends && (
        <div className="search-idle-hint">
          <div className="search-idle-icon">📖</div>
          <div>人物名やキーワードを入力して<br />格言を探しましょう</div>
        </div>
      )}

    </div>
  )
}
