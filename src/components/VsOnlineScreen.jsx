import { useState, useEffect, useRef, useCallback } from 'react'
import { listenToRoom, updatePlayer, getQuestionsById } from '../services/roomService'
import { matchAnswer } from '../utils/matchAnswer'
import './VsOnlineScreen.css'

const TOTAL_QUESTIONS = 10
const TIME_LIMIT = 10

export default function VsOnlineScreen({ roomCode, playerSlot, username, onEnd, onQuit }) {
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
  const myData = room?.[playerSlot]
  const opponentData = room?.[opponentSlot]
  const opponentName = opponentData?.name || 'Adversar'
  const myName = username

  const handleTimeUp = useCallback(() => {
    if (!question) return
    updatePlayer(roomCode, playerSlot, {
      score,
      current: currentIndex,
      lastResult: 'timeout',
    })
    setFeedback({
      correct: false,
      message: '⏰ Timpul a expirat! ' + question.replica_ironica
    })
  }, [question, roomCode, playerSlot, score, currentIndex])

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
      lastResult: correct ? 'correct' : 'wrong',
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

  const bothFinished = finished && opponentData?.finished

  useEffect(() => {
    if (bothFinished) {
      onEnd({
        score: null,
        total: TOTAL_QUESTIONS,
        vsScores: playerSlot === 'player1'
          ? [score, opponentData.score]
          : [opponentData.score, score],
        vsNames: playerSlot === 'player1'
          ? [myName, opponentName]
          : [opponentName, myName],
        mode: 'vs',
      })
    }
  }, [bothFinished, score, opponentData, onEnd, playerSlot, myName, opponentName])

  // Waiting screens
  if (!room || room.status === 'waiting') {
    return (
      <div className="vs-lobby-wait">
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
      <div className="vs-lobby-wait">
        <div className="lobby-content">
          <div className="lobby-emoji">⏳</div>
          <h2 className="lobby-title">Se încarcă...</h2>
        </div>
      </div>
    )
  }

  if (finished && !bothFinished) {
    return (
      <div className="vs-lobby-wait">
        <div className="lobby-content">
          <div className="lobby-emoji">⏳</div>
          <h2 className="lobby-title">Ai terminat!</h2>
          <p className="online-final-score">Scorul tău: <strong>{score}/{TOTAL_QUESTIONS}</strong></p>
          <p className="lobby-hint">Așteptăm pe {opponentName} să termine...</p>
          <div className="opponent-progress">
            {opponentName}: întrebarea {Math.min((opponentData?.current || 0) + 1, TOTAL_QUESTIONS)}/{TOTAL_QUESTIONS}
          </div>
        </div>
      </div>
    )
  }

  const progress = ((currentIndex + 1) / TOTAL_QUESTIONS) * 100
  const timerUrgent = timeLeft <= 3
  const opCurrent = opponentData?.current ?? 0
  const opLastResult = opponentData?.lastResult

  return (
    <div className="vs-screen">
      {/* VS Header */}
      <div className="vs-header">
        <button className="vs-quit-btn" onClick={onQuit}>✕</button>
        <div className="vs-matchup">
          <div className="vs-player vs-player-me">
            <span className="vs-player-name vs-name-me">{myName}</span>
            <span className="vs-player-score vs-score-me">{score}</span>
          </div>
          <span className="vs-versus">VS</span>
          <div className="vs-player vs-player-opp">
            <span className="vs-player-score vs-score-opp">{opponentData?.score ?? 0}</span>
            <span className="vs-player-name vs-name-opp">{opponentName}</span>
          </div>
        </div>
      </div>

      <div className="vs-progress-bar">
        <div className="vs-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Split screen */}
      <div className="vs-split">
        {/* My half */}
        <div className="vs-half vs-half-mine">
          <div className={`vs-countdown ${timerUrgent ? 'countdown-urgent' : ''} ${feedback ? 'countdown-done' : ''}`}>
            <svg className="countdown-ring" viewBox="0 0 60 60">
              <defs>
                <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <circle className="countdown-track" cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <circle
                className="countdown-value"
                cx="30" cy="30" r="26"
                fill="none"
                stroke="url(#cg)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={2 * Math.PI * 26 * (1 - timeLeft / TIME_LIMIT)}
                style={{ transition: 'stroke-dashoffset 0.3s linear' }}
              />
            </svg>
            <span className="countdown-number">{timeLeft}</span>
          </div>

          <div className="vs-question-label">Întrebarea {currentIndex + 1}/{TOTAL_QUESTIONS}</div>
          <h2 className="vs-question-text">{question.intrebare}</h2>

          <div className="vs-answer-area">
            <input
              ref={inputRef}
              type="text"
              className={`vs-answer-input ${feedback ? (feedback.correct ? 'input-correct' : 'input-wrong') : ''}`}
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
                className="vs-submit-btn"
                onClick={submitAnswer}
                disabled={!userAnswer.trim()}
              >
                Verifică
              </button>
            )}
          </div>

          {feedback && (
            <div className={`vs-feedback ${feedback.correct ? 'vs-feedback-correct' : 'vs-feedback-wrong'}`}>
              <p className="vs-feedback-msg">{feedback.message}</p>
              <p className="vs-feedback-answer">Răspuns: <strong>{question.raspuns}</strong></p>
              <button className="vs-next-btn" onClick={nextQuestion}>
                {currentIndex + 1 >= TOTAL_QUESTIONS ? 'Finalizează' : 'Următoarea →'}
              </button>
            </div>
          )}
        </div>

        {/* Opponent half */}
        <div className="vs-half vs-half-opponent">
          <div className="vs-opp-header">
            <span className="vs-opp-avatar">👤</span>
            <span className="vs-opp-name">{opponentName}</span>
          </div>

          <div className="vs-opp-status">
            <div className="vs-opp-stat">
              <span className="vs-opp-stat-label">Întrebarea</span>
              <span className="vs-opp-stat-value">{Math.min(opCurrent + 1, TOTAL_QUESTIONS)}/{TOTAL_QUESTIONS}</span>
            </div>
            <div className="vs-opp-stat">
              <span className="vs-opp-stat-label">Scor</span>
              <span className="vs-opp-stat-value">{opponentData?.score ?? 0}</span>
            </div>
          </div>

          <div className="vs-opp-activity">
            {opponentData?.finished ? (
              <div className="vs-opp-event vs-opp-finished">
                🏁 A terminat!
              </div>
            ) : opLastResult === 'correct' ? (
              <div className="vs-opp-event vs-opp-correct">
                ✅ A răspuns corect!
              </div>
            ) : opLastResult === 'wrong' ? (
              <div className="vs-opp-event vs-opp-wrong">
                ❌ A greșit!
              </div>
            ) : opLastResult === 'timeout' ? (
              <div className="vs-opp-event vs-opp-wrong">
                ⏰ I-a expirat timpul!
              </div>
            ) : (
              <div className="vs-opp-event vs-opp-thinking">
                💭 Se gândește...
              </div>
            )}
          </div>

          <div className="vs-opp-progress-bar">
            <div
              className="vs-opp-progress-fill"
              style={{ width: `${(Math.min(opCurrent + 1, TOTAL_QUESTIONS) / TOTAL_QUESTIONS) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
