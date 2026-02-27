import { useState } from 'react'
import HomeScreen     from './screens/HomeScreen'
import CategoryScreen from './screens/CategoryScreen'
import QuizScreen     from './screens/QuizScreen'
import ResultScreen   from './screens/ResultScreen'
import ScoreScreen    from './screens/ScoreScreen'
import BadgeScreen    from './screens/BadgeScreen'
import SettingsScreen from './screens/SettingsScreen'
import SearchScreen   from './screens/SearchScreen'
import { useProgress } from './hooks/useProgress'
import { useSound }    from './hooks/useSound'
import { quizData }    from './data/quizData'
import { selectQuestions } from './lib/selectQuestions'

const TABS = [
  { id: 'home',     icon: '🏠', label: 'ホーム'  },
  { id: 'search',   icon: '🔍', label: '検索'    },
  { id: 'score',    icon: '📊', label: 'スコア'  },
  { id: 'badge',    icon: '🏅', label: 'バッジ'  },
  { id: 'settings', icon: '⚙️', label: '設定'    },
]

export default function App() {
  const [activeTab,    setActiveTab]    = useState('home')
  const [activeScreen, setActiveScreen] = useState(null)  // null | 'categories' | 'quiz' | 'result'
  const [quizConfig,   setQuizConfig]   = useState(null)
  const [quizResult,   setQuizResult]   = useState(null)

  const progress = useProgress()
  const sound    = useSound()

  // ── クイズ開始 ──────────────────────────────────────────────
  const startQuiz = (mode, category = null) => {
    let questions

    switch (mode) {
      case 'random': {
        // ステップ3の出題アルゴリズムで5問選択
        const { questions: q } = selectQuestions(quizData, progress.questionStats)
        questions = q
        break
      }
      case 'category': {
        questions = quizData
          .filter(q => q.category === category)
          .sort(() => Math.random() - 0.5)
        break
      }
      case 'review': {
        const wrongSet = new Set(progress.wrongAnswers)
        questions = quizData
          .filter(q => wrongSet.has(q.id))
          .sort(() => Math.random() - 0.5)
        break
      }
      default:
        questions = [...quizData].sort(() => Math.random() - 0.5)
    }

    if (questions.length === 0) {
      alert('この条件に該当する問題がありません')
      return
    }

    setQuizConfig({ mode, category, questions })
    setActiveScreen('quiz')
  }

  // ── クイズ完了 ──────────────────────────────────────────────
  const handleQuizComplete = (result) => {
    const isPerfect = result.answers.length > 0 && result.answers.every(a => a.correct)
    progress.recordAnswers(result.answers, isPerfect)
    setQuizResult({ ...result, isPerfect })
    setActiveScreen('result')
  }

  // ── 結果→ホームへ ───────────────────────────────────────────
  const backToHome = () => {
    setActiveScreen(null)
    setQuizConfig(null)
    setQuizResult(null)
  }

  // ── フルスクリーンモード（クイズ・カテゴリ・結果） ──────────
  if (activeScreen === 'categories') {
    return (
      <div className="app-wrapper">
        <CategoryScreen
          onBack={() => setActiveScreen(null)}
          onSelectCategory={cat => startQuiz('category', cat)}
          progress={progress}
          sound={sound}
        />
      </div>
    )
  }

  if (activeScreen === 'quiz' && quizConfig) {
    return (
      <div className="app-wrapper">
        <QuizScreen
          config={quizConfig}
          onComplete={handleQuizComplete}
          onBack={backToHome}
          sound={sound}
        />
      </div>
    )
  }

  if (activeScreen === 'result' && quizResult) {
    return (
      <div className="app-wrapper">
        <ResultScreen
          result={quizResult}
          onHome={backToHome}
          onRetry={() => {
            setActiveScreen(null)
            setQuizResult(null)
            startQuiz(quizConfig.mode, quizConfig.category)
          }}
        />
      </div>
    )
  }

  // ── タブナビモード ───────────────────────────────────────────
  return (
    <div className="app-wrapper app-wrapper--tabs">
      <div className="tab-content">
        {activeTab === 'home' && (
          <HomeScreen
            onStartQuiz={startQuiz}
            onCategorySelect={() => setActiveScreen('categories')}
            progress={progress}
            sound={sound}
          />
        )}
        {activeTab === 'search' && (
          <SearchScreen progress={progress} />
        )}
        {activeTab === 'score' && (
          <ScoreScreen
            progress={progress}
            totalQuestions={quizData.length}
          />
        )}
        {activeTab === 'badge' && (
          <BadgeScreen progress={progress} />
        )}
        {activeTab === 'settings' && (
          <SettingsScreen
            progress={progress}
            onReset={progress.resetAll}
          />
        )}
      </div>

      {/* ─── タブバー ─── */}
      <nav className="tab-bar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? ' tab-btn--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-btn-icon">{tab.icon}</span>
            <span className="tab-btn-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
