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

export default function GameScreen({ mode, onEnd, onQuit }) {
  const [gameQuestions] = useState(() => shuffleArray(questions).slice(0, TOTAL_QUESTIONS))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState(null) // { correct, message }
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [vsScores, setVsScores] = useState([0, 0])
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const inputRef = useRef(null)

  const isVs = mode === 'vs'
  const question = gameQuestions[currentIndex]

  useEffect(() => {
    if (!feedback && inputRef.current) {
      inputRef.current.focus()
    }
  }, [currentIndex, feedback])

  const submitAnswer = useCallback(() => {
    if (!userAnswer.trim() || feedback) return

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
        // Player 2's turn on same question
        setCurrentPlayer(1)
        setUserAnswer('')
        setFeedback(null)
        return
      }
      // Both players answered, move to next question
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
