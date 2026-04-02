import { useState, useEffect, useRef, useMemo } from 'react'
import {
  listenToRoom, submitAnswer, updateScore,
  advanceQuestion, setRoomStatus, getQuestionsById
} from '../services/roomService'
import './VsOnlineScreen.css'

const TOTAL_QUESTIONS = 10
const TIME_LIMIT = 20
const RESULTS_DELAY = 4000

function shuffleArray(arr) {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function VsOnlineScreen({ roomCode, playerSlot, username, onEnd, onQuit }) {
  const [room, setRoom] = useState(null)
  const [gameQuestions, setGameQuestions] = useState(null)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [localAnswer, setLocalAnswer] = useState(null)
  const timerRef = useRef(null)
  const advanceRef = useRef(null)
  const handledTimeUp = useRef(false)
  const unsubRef = useRef(null)
  const prevQuestionRef = useRef(-1)

  const opponentSlot = playerSlot === 'player1' ? 'player2' : 'player1'

  // Listen to room
  useEffect(() => {
    unsubRef.current = listenToRoom(roomCode, (roomData) => {
      setRoom(roomData)
      if (!gameQuestions && roomData.questionIds) {
        setGameQuestions(getQuestionsById(roomData.questionIds))
      }
    })
    return () => {
      unsubRef.current?.()
      clearInterval(timerRef.current)
      clearTimeout(advanceRef.current)
    }
  }, [roomCode, gameQuestions])

  const currentIndex = room?.currentQuestion ?? 0
  const question = gameQuestions?.[currentIndex]
  const myData = room?.[playerSlot]
  const opponentData = room?.[opponentSlot]
  const myAnswer = myData?.answer
  const opAnswer = opponentData?.answer
  const bothAnswered = myAnswer !== null && myAnswer !== undefined &&
                       opAnswer !== null && opAnswer !== undefined
  const myName = username
  const opponentName = opponentData?.name || 'Adversar'

  // Shuffle options per question (stable per currentIndex)
  const options = useMemo(() => {
    if (!question) return []
    return shuffleArray([question.raspuns, ...question.variante_gresite])
    // eslint-disable-next-line
  }, [currentIndex, question?.id])

  // Reset state when question changes (from Firebase)
  useEffect(() => {
    if (currentIndex !== prevQuestionRef.current) {
      prevQuestionRef.current = currentIndex
      setLocalAnswer(null)
      handledTimeUp.current = false
      clearTimeout(advanceRef.current)

      // Restart timer
      clearInterval(timerRef.current)
      if (currentIndex < TOTAL_QUESTIONS && room?.status === 'playing') {
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
      }
    }
  }, [currentIndex, room?.status])

  // Handle timeout
  useEffect(() => {
    if (timeLeft === 0 && !handledTimeUp.current && !myAnswer && question) {
      handledTimeUp.current = true
      setLocalAnswer('_timeout_')
      submitAnswer(roomCode, playerSlot, '_timeout_')
    }
  }, [timeLeft, myAnswer, question, roomCode, playerSlot])

  // Auto-advance after both answered
  useEffect(() => {
    if (!bothAnswered || !question) return

    clearInterval(timerRef.current)

    // Auto-advance after delay
    advanceRef.current = setTimeout(() => {
      const nextIndex = currentIndex + 1
      if (nextIndex >= TOTAL_QUESTIONS) {
        setRoomStatus(roomCode, 'finished')
      } else {
        advanceQuestion(roomCode, nextIndex)
      }
    }, RESULTS_DELAY)

    return () => clearTimeout(advanceRef.current)
  }, [bothAnswered, currentIndex, question, roomCode])

  // Detect game finished
  useEffect(() => {
    if (room?.status === 'finished' && gameQuestions) {
      clearInterval(timerRef.current)
      clearTimeout(advanceRef.current)
      onEnd({
        score: null,
        total: TOTAL_QUESTIONS,
        vsScores: [room.player1?.score ?? 0, room.player2?.score ?? 0],
        vsNames: [room.player1?.name ?? 'J1', room.player2?.name ?? 'J2'],
        mode: 'vs',
      })
    }
  }, [room?.status, gameQuestions, onEnd, room?.player1, room?.player2])

  function handleAnswer(answer) {
    if (localAnswer || !question) return
    setLocalAnswer(answer)

    const correct = answer === question.raspuns
    const newScore = (myData?.score ?? 0) + (correct ? 1 : 0)

    submitAnswer(roomCode, playerSlot, answer)
    if (correct) {
      updateScore(roomCode, playerSlot, newScore)
    }
  }

  // Waiting for opponent to join
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

  const timerUrgent = timeLeft <= 5
  const showResults = bothAnswered
  const myCorrect = myAnswer === question.raspuns
  const opCorrect = opAnswer === question.raspuns
  const myTimedOut = myAnswer === '_timeout_'
  const opTimedOut = opAnswer === '_timeout_'

  return (
    <div className="vs-screen">
      {/* VS Header */}
      <div className="vs-header">
        <button className="vs-quit-btn" onClick={onQuit}>✕</button>
        <div className="vs-matchup">
          <div className="vs-player vs-player-me">
            <span className="vs-player-name vs-name-me">{myName}</span>
            <span className="vs-player-score vs-score-me">{myData?.score ?? 0}</span>
          </div>
          <span className="vs-versus">VS</span>
          <div className="vs-player vs-player-opp">
            <span className="vs-player-score vs-score-opp">{opponentData?.score ?? 0}</span>
            <span className="vs-player-name vs-name-opp">{opponentName}</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="vs-progress-bar">
        <div className="vs-progress-fill" style={{ width: `${((currentIndex + 1) / TOTAL_QUESTIONS) * 100}%` }} />
      </div>

      {/* Countdown */}
      <div className={`vs-countdown ${timerUrgent && !showResults ? 'countdown-urgent' : ''} ${showResults ? 'countdown-done' : ''}`}>
        <svg className="countdown-ring" viewBox="0 0 60 60">
          <defs>
            <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
          <circle
            cx="30" cy="30" r="26"
            fill="none"
            stroke={timerUrgent && !showResults ? '#ef4444' : 'url(#cg)'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 26}
            strokeDashoffset={2 * Math.PI * 26 * (1 - timeLeft / TIME_LIMIT)}
            style={{ transition: showResults ? 'none' : 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <span className="countdown-number">{showResults ? '✓' : timeLeft}</span>
      </div>

      {/* Question */}
      <div className="vs-game-body">
        <div className="vs-question-label">Întrebarea {currentIndex + 1}/{TOTAL_QUESTIONS}</div>
        <h2 className="vs-question-text">{question.intrebare}</h2>

        {/* Options */}
        <div className="vs-options-grid">
          {options.map((option, i) => {
            const isCorrect = option === question.raspuns
            const isMyPick = option === localAnswer
            const isOpPick = showResults && option === opAnswer
            let btnClass = 'vs-option-btn'

            if (showResults) {
              if (isCorrect) btnClass += ' option-correct'
              else if (isMyPick && !isCorrect) btnClass += ' option-wrong'
              else btnClass += ' option-dimmed'
            } else if (isMyPick) {
              btnClass += ' option-selected'
            }

            return (
              <button
                key={`${currentIndex}-${i}`}
                className={btnClass}
                onClick={() => handleAnswer(option)}
                disabled={!!localAnswer}
              >
                <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                <span className="option-text">{option}</span>
                {showResults && isMyPick && <span className="option-tag tag-me">Tu</span>}
                {showResults && isOpPick && !isMyPick && <span className="option-tag tag-opp">{opponentName.slice(0, 6)}</span>}
                {showResults && isOpPick && isMyPick && <span className="option-tag tag-opp">Ambii</span>}
              </button>
            )
          })}
        </div>

        {/* Waiting / Results */}
        {localAnswer && !showResults && (
          <div className="vs-waiting-badge">
            <span className="vs-waiting-dot" />
            Așteptăm pe {opponentName}...
          </div>
        )}

        {showResults && (
          <div className="vs-round-result">
            <div className={`vs-result-row ${myCorrect ? 'result-correct' : 'result-wrong'}`}>
              <span className="vs-result-name">{myName}</span>
              <span className="vs-result-icon">
                {myTimedOut ? '⏰' : myCorrect ? '✅' : '❌'}
              </span>
            </div>
            <div className={`vs-result-row ${opCorrect ? 'result-correct' : 'result-wrong'}`}>
              <span className="vs-result-name">{opponentName}</span>
              <span className="vs-result-icon">
                {opTimedOut ? '⏰' : opCorrect ? '✅' : '❌'}
              </span>
            </div>
            <p className="vs-result-answer">Răspuns corect: <strong>{question.raspuns}</strong></p>
            <div className="vs-auto-advance">Următoarea întrebare în câteva secunde...</div>
          </div>
        )}
      </div>
    </div>
  )
}
