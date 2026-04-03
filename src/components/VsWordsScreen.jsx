import { useState, useEffect, useRef, useCallback } from 'react'
import {
  listenToRoom, updateWordScore, setPlayerFinished,
  setRoomStatus, deleteRoom
} from '../services/roomService'
import { saveDuelResult } from '../services/userService'
import './VsWordsScreen.css'

const GAME_TIME = 60
const WORDWAR_IMAGES = [1, 2, 3, 4, 5, 6]

function randomBg() {
  const img = WORDWAR_IMAGES[Math.floor(Math.random() * WORDWAR_IMAGES.length)]
  return `${import.meta.env.BASE_URL}wordwars/${img}.png`
}

export default function VsWordsScreen({ roomCode, playerSlot, username, onEnd, onQuit }) {
  const [room, setRoom] = useState(null)
  const [dict, setDict] = useState(null)
  const [letters, setLetters] = useState([])
  const [foundWords, setFoundWords] = useState([])
  const [selected, setSelected] = useState([])
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [shake, setShake] = useState(false)
  const [flash, setFlash] = useState(null)
  const [score, setScore] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [lastWord, setLastWord] = useState(null)
  const [started, setStarted] = useState(false)
  const [bgImage] = useState(() => randomBg())

  const timerRef = useRef(null)
  const letterRefs = useRef([])
  const circleRef = useRef(null)
  const selectedRef = useRef([])
  const draggingRef = useRef(false)
  const unsubRef = useRef(null)
  const finishedRef = useRef(false)

  const opponentSlot = playerSlot === 'player1' ? 'player2' : 'player1'
  const opponentData = room?.[opponentSlot]
  const myData = room?.[playerSlot]
  const opponentName = opponentData?.name || 'Adversar'

  // Load dictionary
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}dict-ro.txt`)
      .then(r => r.text())
      .then(text => setDict(new Set(text.trim().split('\n'))))
  }, [])

  // Listen to room
  useEffect(() => {
    unsubRef.current = listenToRoom(roomCode, (roomData) => {
      setRoom(roomData)
      if (roomData.letters) {
        setLetters(roomData.letters)
      }
    })
    return () => {
      unsubRef.current?.()
      clearInterval(timerRef.current)
    }
  }, [roomCode])

  // Start timer when both players ready and dict loaded
  useEffect(() => {
    if (!dict || !room || room.status !== 'playing' || started) return
    if (!room.startedAt) return

    setStarted(true)
    // Calculate remaining time from server start
    const elapsed = Math.floor((Date.now() - room.startedAt) / 1000)
    const remaining = Math.max(0, GAME_TIME - elapsed)
    setTimeLeft(remaining)

    if (remaining <= 0) return

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [dict, room, started])

  // Time's up — mark as finished
  useEffect(() => {
    if (timeLeft === 0 && started && !finishedRef.current) {
      finishedRef.current = true
      clearInterval(timerRef.current)
      setPlayerFinished(roomCode, playerSlot)
    }
  }, [timeLeft, started, roomCode, playerSlot])

  // Both finished → end game
  useEffect(() => {
    if (!room || !finishedRef.current) return
    const p1Done = room.player1?.finished
    const p2Done = room.player2?.finished

    if (p1Done && p2Done && room.status !== 'finished') {
      setRoomStatus(roomCode, 'finished')
    }
  }, [room, roomCode])

  // Game finished → navigate to results
  useEffect(() => {
    if (room?.status !== 'finished') return

    const result = {
      score: null,
      total: null,
      vsScores: [room.player1?.score ?? 0, room.player2?.score ?? 0],
      vsNames: [room.player1?.name ?? 'J1', room.player2?.name ?? 'J2'],
      vsWordsFound: [room.player1?.wordsFound ?? 0, room.player2?.wordsFound ?? 0],
      mode: 'vs',
    }

    saveDuelResult(result)
    unsubRef.current?.()
    unsubRef.current = null
    deleteRoom(roomCode)
    onEnd(result)
  }, [room?.status])

  // Shuffle letters locally (same set, different positions)
  function shuffleLetters() {
    setLetters(prev => {
      const arr = [...prev]
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]]
      }
      return arr
    })
  }

  // Find letter at point
  const getLetterAtPoint = useCallback((x, y) => {
    for (let i = 0; i < letterRefs.current.length; i++) {
      const el = letterRefs.current[i]
      if (!el) continue
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      if (dist < rect.width * 0.6) return i
    }
    return -1
  }, [])

  useEffect(() => { selectedRef.current = selected }, [selected])
  useEffect(() => { draggingRef.current = isDragging }, [isDragging])

  function handlePointerDown(e, index) {
    if (!dict || timeLeft === 0 || !started) return
    e.preventDefault()
    setIsDragging(true)
    setSelected([index])
  }

  useEffect(() => {
    function handlePointerMove(e) {
      if (!draggingRef.current) return
      e.preventDefault()

      const x = e.touches ? e.touches[0].clientX : e.clientX
      const y = e.touches ? e.touches[0].clientY : e.clientY
      const idx = getLetterAtPoint(x, y)

      if (idx >= 0) {
        const prev = selectedRef.current
        if (prev.length >= 2 && idx === prev[prev.length - 2]) {
          const next = prev.slice(0, -1)
          selectedRef.current = next
          setSelected(next)
        } else if (!prev.includes(idx)) {
          const next = [...prev, idx]
          selectedRef.current = next
          setSelected(next)
        }
      }
    }

    function handlePointerUp() {
      if (!draggingRef.current) return
      draggingRef.current = false
      setIsDragging(false)

      const sel = selectedRef.current
      const word = sel.map(i => letters[i]).join('')

      if (word.length >= 2 && dict && dict.has(word) && !foundWords.includes(word)) {
        const points = word.length
        const newScore = score + points
        const newWordsFound = foundWords.length + 1
        setScore(newScore)
        setFoundWords(prev => [...prev, word])
        setLastWord({ word, points })
        setFlash('correct')
        setTimeout(() => { setFlash(null); setLastWord(null) }, 800)
        // Update Firebase
        updateWordScore(roomCode, playerSlot, newScore, newWordsFound)
      } else if (sel.length >= 2) {
        setShake(true)
        setFlash('wrong')
        setTimeout(() => { setShake(false); setFlash(null) }, 500)
      }
      selectedRef.current = []
      setSelected([])
    }

    window.addEventListener('mousemove', handlePointerMove)
    window.addEventListener('mouseup', handlePointerUp)
    window.addEventListener('touchmove', handlePointerMove, { passive: false })
    window.addEventListener('touchend', handlePointerUp)

    return () => {
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('mouseup', handlePointerUp)
      window.removeEventListener('touchmove', handlePointerMove)
      window.removeEventListener('touchend', handlePointerUp)
    }
  }, [getLetterAtPoint, letters, dict, foundWords, score, roomCode, playerSlot])

  const currentWord = selected.map(i => letters[i]).join('')
  const timerUrgent = timeLeft <= 10

  // SVG lines
  function getLinePoints() {
    if (selected.length < 2) return []
    const lines = []
    for (let i = 1; i < selected.length; i++) {
      const a = letterRefs.current[selected[i - 1]]
      const b = letterRefs.current[selected[i]]
      if (!a || !b || !circleRef.current) continue
      const cr = circleRef.current.getBoundingClientRect()
      const ar = a.getBoundingClientRect()
      const br = b.getBoundingClientRect()
      lines.push({
        x1: ar.left + ar.width / 2 - cr.left,
        y1: ar.top + ar.height / 2 - cr.top,
        x2: br.left + br.width / 2 - cr.left,
        y2: br.top + br.height / 2 - cr.top,
      })
    }
    return lines
  }

  const lines = selected.length >= 2 ? getLinePoints() : []

  // Waiting states
  if (!room || room.status === 'waiting') {
    return (
      <div className="vsw" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="vsw-wait-content">
          <div className="lobby-emoji">⏳</div>
          <h2 className="lobby-title">Așteaptă adversarul</h2>
          <div className="room-code">{roomCode}</div>
          <p className="lobby-hint">Trimite codul prietenului tău</p>
        </div>
      </div>
    )
  }

  if (!dict) {
    return (
      <div className="vsw" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="vsw-wait-content">
          <div className="vsw-loading-text">Se încarcă dicționarul...</div>
        </div>
      </div>
    )
  }

  const myScore = score
  const opScore = opponentData?.score ?? 0
  const opWords = opponentData?.wordsFound ?? 0
  const scoreDiff = myScore - opScore
  const winning = scoreDiff > 0
  const losing = scoreDiff < 0

  return (
    <div className="vsw" style={{ backgroundImage: `url(${bgImage})` }}>
      <button className="vsw-quit" onClick={onQuit}>✕</button>

      {/* VS Arena header */}
      <div className="vsw-arena">
        <div className="vsw-fighter vsw-fighter-me">
          <div className="vsw-avatar vsw-avatar-me">🧠</div>
          <span className="vsw-name vsw-name-me">{username}</span>
          <span className="vsw-fighter-score">{myScore} pts</span>
          <span className="vsw-fighter-words">{foundWords.length} cuv.</span>
        </div>

        <div className="vsw-center">
          <div className={`vsw-timer ${timerUrgent ? 'vsw-timer-urgent' : ''}`}>
            {timeLeft}
          </div>
          <div className="vsw-vs-badge">VS</div>
          {scoreDiff !== 0 && (
            <div className={`vsw-diff ${winning ? 'vsw-diff-up' : 'vsw-diff-down'}`}>
              {winning ? '+' : ''}{scoreDiff}
            </div>
          )}
        </div>

        <div className="vsw-fighter vsw-fighter-opp">
          <div className="vsw-avatar vsw-avatar-opp">🧠</div>
          <span className="vsw-name vsw-name-opp">{opponentName}</span>
          <span className="vsw-fighter-score">{opScore} pts</span>
          <span className="vsw-fighter-words">{opWords} cuv.</span>
        </div>
      </div>

      {/* Found words */}
      <div className="vsw-words-list">
        {foundWords.length === 0 ? (
          <div className="vsw-words-empty">Formează cuvinte din litere!</div>
        ) : (
          foundWords.slice().reverse().map((w, i) => (
            <span key={i} className="vsw-word-tag">
              {w} <small>+{w.length}</small>
            </span>
          ))
        )}
      </div>

      {/* Current word */}
      <div className={`vsw-current ${shake ? 'vsw-shake' : ''} ${flash === 'correct' ? 'vsw-flash-correct' : flash === 'wrong' ? 'vsw-flash-wrong' : ''}`}>
        {currentWord || (lastWord ? `${lastWord.word} +${lastWord.points}` : '···')}
      </div>

      {/* Letter Circle */}
      <div className="vsw-circle-area">
        <div className="vsw-circle" ref={circleRef}>
          <svg className="vsw-lines">
            {lines.map((l, i) => (
              <line
                key={i}
                x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke="rgba(139, 92, 246, 0.6)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            ))}
          </svg>

          {letters.map((letter, i) => {
            const angle = (i / letters.length) * 2 * Math.PI - Math.PI / 2
            const radius = 38
            const x = 50 + radius * Math.cos(angle)
            const y = 50 + radius * Math.sin(angle)
            const isSelected = selected.includes(i)

            return (
              <div
                key={`${i}-${letter}`}
                ref={el => letterRefs.current[i] = el}
                className={`vsw-letter ${isSelected ? 'vsw-letter-selected' : ''}`}
                style={{ left: `${x}%`, top: `${y}%` }}
                onMouseDown={(e) => handlePointerDown(e, i)}
                onTouchStart={(e) => handlePointerDown(e, i)}
              >
                {letter}
              </div>
            )
          })}
        </div>
      </div>

      {/* Shuffle button */}
      <div className="vsw-controls">
        <button className="vsw-ctrl-btn" onClick={shuffleLetters} title="Amestecă">
          🔀
        </button>
      </div>

      {/* Time's up overlay */}
      {timeLeft === 0 && (
        <div className="vsw-complete-overlay">
          <span className="vsw-complete-icon">⏰</span>
          <span className="vsw-complete-text">Timpul a expirat!</span>
          <span className="vsw-complete-score">{myScore} pts · {foundWords.length} cuvinte</span>
          {!opponentData?.finished && (
            <span className="vsw-waiting-opp">Așteptăm pe {opponentName}...</span>
          )}
        </div>
      )}
    </div>
  )
}
