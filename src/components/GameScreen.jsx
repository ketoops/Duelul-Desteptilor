import { useState, useEffect, useRef, useMemo } from 'react'
import questions from '../data/questions.json'
import './GameScreen.css'

function shuffleArray(arr) {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const TOTAL_QUESTIONS = 10
const TIME_LIMIT = 20

export default function GameScreen({ mode, onEnd, onQuit }) {
  const [gameQuestions] = useState(() => shuffleArray(questions).slice(0, TOTAL_QUESTIONS))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const timerRef = useRef(null)
  const handledTimeUp = useRef(false)

  const question = gameQuestions[currentIndex]

  // Shuffle answer options once per question
  const options = useMemo(() => {
    if (!question) return []
    return shuffleArray([question.raspuns, ...question.variante_gresite])
  }, [question])

  // Timer
  useEffect(() => {
    clearInterval(timerRef.current)
    if (feedback) return

    handledTimeUp.current = false
    setTimeLeft(TIME_LIMIT)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [currentIndex, feedback])

  useEffect(() => {
    if (timeLeft === 0 && !feedback && !handledTimeUp.current) {
      handledTimeUp.current = true
      setStreak(0)
      setFeedback({
        correct: false,
        message: '⏰ Timpul a expirat! ' + question.replica_ironica
      })
    }
  }, [timeLeft, feedback, question])

  function handleAnswer(answer) {
    if (feedback) return
    clearInterval(timerRef.current)
    setSelectedAnswer(answer)

    const correct = answer === question.raspuns

    if (correct) {
      setScore(prev => prev + 1)
      setStreak(prev => prev + 1)
    } else {
      setStreak(0)
    }

    setFeedback({
      correct,
      message: correct
        ? '✅ Corect! ' + (question.explicatie || '')
        : '❌ Greșit! ' + question.replica_ironica
    })
  }

  function nextQuestion() {
    const nextIndex = currentIndex + 1

    if (nextIndex >= TOTAL_QUESTIONS) {
      onEnd({ score, total: TOTAL_QUESTIONS, mode })
      return
    }

    setCurrentIndex(nextIndex)
    setSelectedAnswer(null)
    setFeedback(null)
  }

  const progress = ((currentIndex + 1) / TOTAL_QUESTIONS) * 100
  const timerUrgent = timeLeft <= 5

  return (
    <div className="game">
      <div className="game-header">
        <button className="quit-btn" onClick={onQuit}>✕</button>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="game-stats">
          <span className="score">{score}/{TOTAL_QUESTIONS}</span>
          {streak > 1 && <span className="streak">🔥 {streak}</span>}
        </div>
      </div>

      <div className={`countdown ${timerUrgent ? 'countdown-urgent' : ''} ${feedback ? 'countdown-done' : ''}`}>
        <svg className="countdown-ring" viewBox="0 0 60 60">
          <defs>
            <linearGradient id="countdown-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <circle className="countdown-track" cx="30" cy="30" r="26" />
          <circle
            className="countdown-value"
            cx="30" cy="30" r="26"
            strokeDasharray={2 * Math.PI * 26}
            strokeDashoffset={2 * Math.PI * 26 * (1 - timeLeft / TIME_LIMIT)}
          />
        </svg>
        <span className="countdown-number">{timeLeft}</span>
      </div>

      <div className="game-content">
        <div className="question-number">
          Întrebarea {currentIndex + 1}/{TOTAL_QUESTIONS}
        </div>

        <h2 className="question-text">{question.intrebare}</h2>

        <div className="options-grid">
          {options.map((option, i) => {
            const isCorrect = option === question.raspuns
            const isSelected = option === selectedAnswer
            let btnClass = 'option-btn'
            if (feedback) {
              if (isCorrect) btnClass += ' option-correct'
              else if (isSelected && !isCorrect) btnClass += ' option-wrong'
              else btnClass += ' option-dimmed'
            }
            return (
              <button
                key={`${currentIndex}-${i}`}
                className={btnClass}
                onClick={() => handleAnswer(option)}
                disabled={!!feedback}
              >
                <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                <span className="option-text">{option}</span>
              </button>
            )
          })}
        </div>

        {feedback && (
          <div className={`feedback ${feedback.correct ? 'feedback-correct' : 'feedback-wrong'}`}>
            <p className="feedback-message">{feedback.message}</p>
            <button className="next-btn" onClick={nextQuestion}>
              {currentIndex + 1 >= TOTAL_QUESTIONS ? 'Vezi rezultatul' : 'Următoarea →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
