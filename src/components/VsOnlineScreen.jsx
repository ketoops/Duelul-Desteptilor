import { useState, useEffect, useRef, useMemo } from 'react'
import {
  listenToRoom, submitAnswer, updateScore,
  advanceQuestion, setRoomStatus, deleteRoom, getQuestionsById
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
  const bothAnswered = myAnswer != null && opAnswer != null
  const myName = username
  const opponentName = opponentData?.name || 'Adversar'

  const options = useMemo(() => {
    if (!question) return []
    return shuffleArray([question.raspuns, ...question.variante_gresite])
    // eslint-disable-next-line
  }, [currentIndex, question?.id])

  // Reset on question change
  useEffect(() => {
    if (currentIndex !== prevQuestionRef.current) {
      prevQuestionRef.current = currentIndex
      setLocalAnswer(null)
      handledTimeUp.current = false
      clearTimeout(advanceRef.current)
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

  // Timeout
  useEffect(() => {
    if (timeLeft === 0 && !handledTimeUp.current && !myAnswer && question) {
      handledTimeUp.current = true
      setLocalAnswer('_timeout_')
      submitAnswer(roomCode, playerSlot, '_timeout_')
    }
  }, [timeLeft, myAnswer, question, roomCode, playerSlot])

  // Auto-advance
  useEffect(() => {
    if (!bothAnswered || !question) return
    clearInterval(timerRef.current)

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

  // Game finished — save results, delete room, navigate
  useEffect(() => {
    if (room?.status === 'finished' && gameQuestions) {
      clearInterval(timerRef.current)
      clearTimeout(advanceRef.current)
      const result = {
        score: null,
        total: TOTAL_QUESTIONS,
        vsScores: [room.player1?.score ?? 0, room.player2?.score ?? 0],
        vsNames: [room.player1?.name ?? 'J1', room.player2?.name ?? 'J2'],
        mode: 'vs',
      }
      // Unsubscribe before deleting to avoid errors
      unsubRef.current?.()
      unsubRef.current = null
      // Delete the room from Firebase
      deleteRoom(roomCode)
      onEnd(result)
    }
  }, [room?.status, gameQuestions, onEnd, room?.player1, room?.player2, roomCode])

  function handleAnswer(answer) {
    if (localAnswer || !question) return
    setLocalAnswer(answer)
    const correct = answer === question.raspuns
    const newScore = (myData?.score ?? 0) + (correct ? 1 : 0)
    submitAnswer(roomCode, playerSlot, answer)
    if (correct) updateScore(roomCode, playerSlot, newScore)
  }

  // Waiting
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
    <div className="duel">
      {/* Arena — VS section (top) */}
      <div className="duel-arena">
        <div className="duel-fighter duel-fighter-me">
          <div className={`duel-avatar ${showResults ? (myCorrect ? 'avatar-win' : 'avatar-lose') : (localAnswer ? 'avatar-ready' : '')}`}>
            {showResults ? (myTimedOut ? '⏰' : myCorrect ? '🎉' : '😵') : '🧠'}
          </div>
          <span className="duel-fighter-name duel-name-me">{myName}</span>
        </div>

        <div className="duel-center">
          <div className={`duel-timer ${timerUrgent && !showResults ? 'timer-urgent' : ''} ${showResults ? 'timer-done' : ''}`}>
            {showResults ? '⚔️' : timeLeft}
          </div>
          <div className="duel-vs-badge">VS</div>
        </div>

        <div className="duel-fighter duel-fighter-opp">
          <div className={`duel-avatar ${showResults ? (opCorrect ? 'avatar-win' : 'avatar-lose') : (opAnswer != null ? 'avatar-ready' : '')}`}>
            {showResults ? (opTimedOut ? '⏰' : opCorrect ? '🎉' : '😵') : '🧠'}
          </div>
          <span className="duel-fighter-name duel-name-opp">{opponentName}</span>
        </div>
      </div>

      {/* Bottom section — question + options pushed down */}
      <div className="duel-bottom">
        {/* Waiting indicator */}
        {localAnswer && !showResults && (
          <div className="duel-waiting">
            <span className="duel-waiting-dot" /> Așteptăm pe {opponentName}...
          </div>
        )}

        {/* Results flash */}
        {showResults && (
          <div className="duel-result-flash">
            <span className="duel-correct-answer">Răspuns corect: <strong>{question.raspuns}</strong></span>
          </div>
        )}

        {/* Question card — right above options */}
        <div className="duel-question-card">
          <div className="duel-question-num">Întrebarea {currentIndex + 1}/{TOTAL_QUESTIONS}</div>
          <h2 className="duel-question-text">{question.intrebare}</h2>
        </div>

        {/* 4 Answer options */}
        <div className="duel-options">
        {options.map((option, i) => {
          const isCorrect = option === question.raspuns
          const isMyPick = option === localAnswer
          const isOpPick = showResults && option === opAnswer
          let cls = 'duel-opt'

          if (showResults) {
            if (isCorrect) cls += ' duel-opt-correct'
            else if (isMyPick) cls += ' duel-opt-wrong'
            else cls += ' duel-opt-dim'
          } else if (isMyPick) {
            cls += ' duel-opt-picked'
          }

          return (
            <button
              key={`${currentIndex}-${i}`}
              className={cls}
              onClick={() => handleAnswer(option)}
              disabled={!!localAnswer}
            >
              <span className="duel-opt-letter">{String.fromCharCode(65 + i)}</span>
              <span className="duel-opt-text">{option}</span>
              {showResults && isMyPick && !isOpPick && <span className="duel-opt-tag tag-me">Tu</span>}
              {showResults && isOpPick && !isMyPick && <span className="duel-opt-tag tag-opp">{opponentName.slice(0,8)}</span>}
              {showResults && isMyPick && isOpPick && <span className="duel-opt-tag tag-both">Ambii</span>}
            </button>
          )
        })}
      </div>

      </div>{/* end duel-bottom */}

      {/* Score bar */}
      <div className="duel-scorebar">
        <div className="duel-score-player duel-score-me">
          <span className="duel-score-value">{myData?.score ?? 0}</span>
          <span className="duel-score-name">{myName}</span>
        </div>
        <div className="duel-score-divider">
          {showResults && <span className="duel-auto-next">Următoarea în câteva secunde...</span>}
        </div>
        <div className="duel-score-player duel-score-opp">
          <span className="duel-score-value">{opponentData?.score ?? 0}</span>
          <span className="duel-score-name">{opponentName}</span>
        </div>
      </div>

      {/* Quit */}
      <button className="duel-quit" onClick={onQuit}>✕ Ieși</button>
    </div>
  )
}
