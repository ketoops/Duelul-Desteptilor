import { useState, useEffect, useRef, useCallback } from 'react'
import { listenToRoom, updatePlayer, getQuestionsById } from '../services/roomService'
import { matchAnswer } from '../utils/matchAnswer'
import './GameScreen.css'
import './VsOnlineScreen.css'

const TOTAL_QUESTIONS = 10
const TIME_LIMIT = 10

export default function VsOnlineScreen({ roomCode, playerSlot, onEnd, onQuit }) {
  const [room, setRoom] = useState(null)
  const [gameQuestions, setGameQuestions] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [finished, setFinished] = useState(false)
  const inputRef = useRef(null)
  const timerRef = useRef(null)
  const unsubRef = useRef(null)

  const opponentSlot = playerSlot === 'player1' ? 'player2' : 'player1'
  const playerLabel = playerSlot === 'player1' ? 'Tu (J1)' : 'Tu (J2)'

  // Listen to room changes
  useEffect(() => {
    unsubRef.current = listenToRoom(roomCode, (roomData) => {
      setRoom(roomData)
      if (!gameQuestions && roomData.questionIds) {
        setGameQuestions(getQuestionsById(roomData.questionIds))
      }
    })
    return () => unsubRef.current?.()
  }, [roomCode, gameQuestions])

  const question = gameQuestions?.[currentIndex]

  // Timer
  const handleTimeUp = useCallback(() => {
    if (!question) return
    setFeedback({
      correct: false,
      message: '⏰ Timpul a expirat! ' + question.replica_ironica
    })
  }, [question])

  useEffect(() => {
    if (feedback || !gameQuestions || finished) {
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
  }, [currentIndex, feedback, gameQuestions, finished])

  useEffect(() => {
    if (timeLeft === 0 && !feedback && !finished) {
      handleTimeUp()
    }
  }, [timeLeft, feedback, finished, handleTimeUp])

  useEffect(() => {
    if (!feedback && !finished && inputRef.current) {
      inputRef.current.focus()
    }
  }, [currentIndex, feedback, finished])

  const submitAnswer = useCallback(() => {
    if (!userAnswer.trim() || feedback || !question) return

    clearInterval(timerRef.current)
    const correct = matchAnswer(userAnswer, question.raspuns)

    const newScore = correct ? score + 1 : score
    if (correct) setScore(newScore)

    updatePlayer(roomCode, playerSlot, {
      score: newScore,
      current: currentIndex,
    })

    setFeedback({
      correct,
      message: correct
        ? '✅ Corect! ' + (question.explicatie || '')
        : '❌ Greșit! ' + question.replica_ironica
    })
  }, [userAnswer, feedback, question, score, roomCode, playerSlot, currentIndex])

  function nextQuestion() {
    const nextIndex = currentIndex + 1

    if (nextIndex >= TOTAL_QUESTIONS) {
      setFinished(true)
      updatePlayer(roomCode, playerSlot, { finished: true, score })
      return
    }

    setCurrentIndex(nextIndex)
    setUserAnswer('')
    setFeedback(null)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      if (feedback) nextQuestion()
      else submitAnswer()
    }
  }

  // Check if both players finished
  const opponentData = room?.[opponentSlot]
  const bothFinished = finished && opponentData?.finished

  useEffect(() => {
    if (bothFinished) {
      onEnd({
        score: null,
        total: TOTAL_QUESTIONS,
        vsScores: playerSlot === 'player1'
          ? [score, opponentData.score]
          : [opponentData.score, score],
        mode: 'vs',
      })
    }
  }, [bothFinished, score, opponentData, onEnd, playerSlot])

  // Waiting for opponent
  if (!room || room.status === 'waiting') {
    return (
      <div className="lobby">
        <div className="lobby-content">
          <div className="lobby-emoji">⏳</div>
          <h2 className="lobby-title">Așteaptă adversarul</h2>
          <div className="room-code">{roomCode}</div>
          <p className="lobby-hint">Trimite codul prietenului tău</p>
        </div>
      </div>
    )
  }

  if (!gameQuestions || !question) {
    return (
      <div className="lobby">
        <div className="lobby-content">
          <div className="lobby-emoji">⏳</div>
          <h2 className="lobby-title">Se încarcă...</h2>
        </div>
      </div>
    )
  }

  // Waiting for opponent to finish
  if (finished && !bothFinished) {
    return (
      <div className="lobby">
        <div className="lobby-content">
          <div className="lobby-emoji">⏳</div>
          <h2 className="lobby-title">Ai terminat!</h2>
          <p className="online-final-score">Scorul tău: <strong>{score}/{TOTAL_QUESTIONS}</strong></p>
          <p className="lobby-hint">Așteptăm adversarul să termine...</p>
          <div className="opponent-progress">
            Adversar: întrebarea {Math.min((opponentData?.current || 0) + 1, TOTAL_QUESTIONS)}/{TOTAL_QUESTIONS}
          </div>
        </div>
      </div>
    )
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
          <span className="vs-score">
            <span className="active-player">{score}</span>
            {' — '}
            <span>{opponentData?.score ?? 0}</span>
          </span>
        </div>
      </div>

      <div className={`countdown ${timerUrgent ? 'countdown-urgent' : ''} ${feedback ? 'countdown-done' : ''}`}>
        <svg className="countdown-ring" viewBox="0 0 60 60">
          <defs>
            <linearGradient id="countdown-gradient-vs" x1="0%" y1="0%" x2="100%" y2="100%">
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
          <span className="player-tag">{playerLabel}</span>
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
              {currentIndex + 1 >= TOTAL_QUESTIONS ? 'Finalizează' : 'Următoarea →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
