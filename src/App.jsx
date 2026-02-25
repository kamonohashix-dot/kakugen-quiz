import { useState } from 'react'
import HomeScreen     from './screens/HomeScreen'
import CategoryScreen from './screens/CategoryScreen'
import QuizScreen     from './screens/QuizScreen'
import ResultScreen   from './screens/ResultScreen'
import { useProgress } from './hooks/useProgress'
import { quizData }    from './data/quizData'

export default function App() {
  const [screen,     setScreen]     = useState('home')
  const [quizConfig, setQuizConfig] = useState(null)
  const [quizResult, setQuizResult] = useState(null)
  const progress = useProgress()

  const startQuiz = (mode, category = null) => {
    let questions

    switch (mode) {
      case 'random': {
        const shuffled = [...quizData].sort(() => Math.random() - 0.5)
        questions = shuffled.slice(0, Math.min(5, shuffled.length))
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
      case 'all': {
        questions = [...quizData].sort(() => Math.random() - 0.5)
        break
      }
      default:
        questions = quizData
    }

    if (questions.length === 0) {
      alert('この条件に該当する問題がありません')
      return
    }

    setQuizConfig({ mode, category, questions })
    setScreen('quiz')
  }

  const handleQuizComplete = (result) => {
    progress.recordAnswers(result.answers)
    setQuizResult(result)
    setScreen('result')
  }

  return (
    <div className="app-wrapper">
      {screen === 'home' && (
        <HomeScreen
          onStartQuiz={startQuiz}
          onCategorySelect={() => setScreen('categories')}
          progress={progress}
        />
      )}

      {screen === 'categories' && (
        <CategoryScreen
          onBack={() => setScreen('home')}
          onSelectCategory={cat => startQuiz('category', cat)}
          progress={progress}
        />
      )}

      {screen === 'quiz' && quizConfig && (
        <QuizScreen
          config={quizConfig}
          onComplete={handleQuizComplete}
          onBack={() => setScreen('home')}
        />
      )}

      {screen === 'result' && quizResult && (
        <ResultScreen
          result={quizResult}
          onHome={() => setScreen('home')}
          onRetry={() => startQuiz(quizConfig.mode, quizConfig.category)}
        />
      )}
    </div>
  )
}
