import { useState, useEffect, useRef, useCallback } from 'react'
import questions from '../data/questions.json'
import { matchAnswer } from '../utils/matchAnswer'
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
const TIME_LIMIT = 10

export default function GameScreen({ mode, onEnd, onQuit }) {
  const [gameQuestions] = useState(() => shuffleArray(questions).slice(0, TOTAL_QUESTIONS))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [vsScores, setVsScores] = useState([0, 0])
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const inputRef = useRef(null)
  const timerRef = useRef(null)

  const isVs = mode === 'vs'
  const question = gameQuestions[currentIndex]

  const handleTimeUp = useCallback(() => {
    setFeedback({
      correct: false,
      message: '⏰ Timpul a expirat! ' + question.replica_ironica
    })
    setStreak(0)
  }, [question])

  // Countdown timer
  useEffect(() => {
    if (feedback) {
      clearInterval(timerRef.current)
      return
    }

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
  }, [currentIndex, currentPlayer, feedback])

  // Trigger time-up when timeLeft hits 0
  useEffect(() => {
    if (timeLeft === 0 && !feedback) {
      handleTimeUp()
    }
  }, [timeLeft, feedback, handleTimeUp])

  useEffect(() => {
    if (!feedback && inputRef.current) {
      inputRef.current.focus()
    }
  }, [currentIndex, feedback])

  const submitAnswer = useCallback(() => {
    if (!userAnswer.trim() || feedback) return

    clearInterval(timerRef.current)
    const correct = matchAnswer(userAnswer, question.raspuns)

    if (correct) {
      if (isVs) {
        setVsScores(prev => {
          const next = [...prev]
          next[currentPlayer]++
          return next
        })
      } else {
        setScore(prev => prev + 1)
        setStreak(prev => prev + 1)
      }
    } else if (!isVs) {
      setStreak(0)
    }

    setFeedback({
      correct,
      message: correct
        ? '✅ Corect! ' + (question.explicatie || '')
        : '❌ Greșit! ' + question.replica_ironica
    })
  }, [userAnswer, feedback, question, isVs, currentPlayer])

  function nextQuestion() {
    const nextIndex = currentIndex + 1

    if (isVs) {
      if (currentPlayer === 0) {
        setCurrentPlayer(1)
        setUserAnswer('')
        setFeedback(null)
        return
      }
      setCurrentPlayer(0)
    }

    if (nextIndex >= TOTAL_QUESTIONS) {
      onEnd({
        score: isVs ? null : score,
        total: TOTAL_QUESTIONS,
        vsScores: isVs ? vsScores : null,
        mode
      })
      return
    }

    setCurrentIndex(nextIndex)
    setUserAnswer('')
    setFeedback(null)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      if (feedback) {
        nextQuestion()
      } else {
        submitAnswer()
      }
    }
  }

  const progress = ((currentIndex + 1) / TOTAL_QUESTIONS) * 100
  const timerUrgent = timeLeft <= 3

  return (
    <div className="game">
      <div className="game-header">
        <button className="quit-btn" onClick={onQuit}>✕</button>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="game-stats">
          {isVs ? (
            <span className="vs-score">
              <span className={currentPlayer === 0 ? 'active-player' : ''}>J1: {vsScores[0]}</span>
              {' — '}
              <span className={currentPlayer === 1 ? 'active-player' : ''}>J2: {vsScores[1]}</span>
            </span>
          ) : (
            <>
              <span className="score">{score}/{TOTAL_QUESTIONS}</span>
              {streak > 1 && <span className="streak">🔥 {streak}</span>}
            </>
          )}
        </div>
      </div>

      <div className={`countdown ${timerUrgent ? 'countdown-urgent' : ''} ${feedback ? 'countdown-done' : ''}`}>
        <svg className="countdown-ring" viewBox="0 0 60 60">
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
          {isVs && <span className="player-tag">Jucător {currentPlayer + 1}</span>}
          Întrebarea {currentIndex + 1}/{TOTAL_QUESTIONS}
        </div>

        <h2 className="question-text">{question.intrebare}</h2>

        <div className="answer-area">
          <input
            ref={inputRef}
            type="text"
            className={`answer-input ${feedback ? (feedback.correct ? 'input-correct' : 'input-wrong') : ''}`}
            placeholder="Scrie răspunsul..."
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!!feedback}
            autoComplete="off"
            autoCapitalize="off"
          />
          {!feedback && (
            <button
              className="submit-btn"
              onClick={submitAnswer}
              disabled={!userAnswer.trim()}
            >
              Verifică
            </button>
          )}
        </div>

        {feedback && (
          <div className={`feedback ${feedback.correct ? 'feedback-correct' : 'feedback-wrong'}`}>
            <p className="feedback-message">{feedback.message}</p>
            <p className="feedback-answer">
              Răspuns corect: <strong>{question.raspuns}</strong>
            </p>
            <button className="next-btn" onClick={nextQuestion}>
              {currentIndex + 1 >= TOTAL_QUESTIONS && (!isVs || currentPlayer === 1)
                ? 'Vezi rezultatul'
                : isVs && currentPlayer === 0
                  ? 'Rândul Jucătorului 2'
                  : 'Următoarea →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
