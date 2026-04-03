import { useState, useEffect, useRef, useCallback } from 'react'
import './WordGameScreen.css'

const WORDWAR_IMAGES = [1, 2, 3, 4, 5, 6]

function randomBg() {
  const img = WORDWAR_IMAGES[Math.floor(Math.random() * WORDWAR_IMAGES.length)]
  return `${import.meta.env.BASE_URL}wordwars/${img}.png`
}

// Romanian letter frequency distribution for random wheel generation
const LETTER_POOL = 'AAAAAEEEEEIIIIOOOOUUUURRRRNNNNTTTTSSSSLLLLCCCCDDDDMMMMPPPBBFFGGHHJKVWXYZ'

function pickLetters() {
  const count = 7 + Math.floor(Math.random() * 3) // 7, 8 or 9
  const pool = LETTER_POOL.split('')
  const picked = []
  const vowels = 'AEIOU'.split('')
  const consonants = pool.filter(l => !vowels.includes(l))

  // Pick 2-3 vowels first
  const vowelCount = 2 + Math.floor(Math.random() * 2)
  const vowelPool = pool.filter(l => vowels.includes(l))
  for (let i = 0; i < vowelCount; i++) {
    picked.push(vowelPool[Math.floor(Math.random() * vowelPool.length)])
  }

  // Fill rest with consonants, max 2 of same letter
  while (picked.length < count) {
    const letter = consonants[Math.floor(Math.random() * consonants.length)]
    if (picked.filter(l => l === letter).length < 2) {
      picked.push(letter)
    }
  }

  // Shuffle
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]]
  }

  return picked
}

export default function WordGameScreen({ onEnd, onQuit }) {
  const [dict, setDict] = useState(null)
  const [phase, setPhase] = useState('setup') // 'setup' | 'playing'
  const [gameDuration, setGameDuration] = useState(60)
  const [letters, setLetters] = useState(null)
  const [foundWords, setFoundWords] = useState([])
  const [selected, setSelected] = useState([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [shake, setShake] = useState(false)
  const [flash, setFlash] = useState(null)
  const [score, setScore] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [lastWord, setLastWord] = useState(null)
  const [bgImage] = useState(() => randomBg())

  const timerRef = useRef(null)
  const letterRefs = useRef([])
  const circleRef = useRef(null)
  const selectedRef = useRef([])
  const draggingRef = useRef(false)

  // Load dictionary
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}dict-ro.txt`)
      .then(r => r.text())
      .then(text => setDict(new Set(text.trim().split('\n'))))
  }, [])

  // Start game
  function startGame(duration) {
    setGameDuration(duration)
    setTimeLeft(duration)
    setLetters(pickLetters())
    setFoundWords([])
    setScore(0)
    setPhase('playing')
  }

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return
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
  }, [phase])

  // Game over
  useEffect(() => {
    if (phase === 'playing' && timeLeft === 0) {
      clearInterval(timerRef.current)
      setTimeout(() => {
        onEnd({
          score,
          wordsFound: foundWords.length,
          words: foundWords,
          mode: 'words',
          gameDuration
        })
      }, 1500)
    }
  }, [timeLeft, phase])

  // Shuffle letters (keep same set, rearrange positions)
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

  // Keep refs in sync
  useEffect(() => { selectedRef.current = selected }, [selected])
  useEffect(() => { draggingRef.current = isDragging }, [isDragging])

  function handlePointerDown(e, index) {
    if (!dict || timeLeft === 0) return
    e.preventDefault()
    setIsDragging(true)
    setSelected([index])
  }

  // Global move/up listeners
  useEffect(() => {
    if (phase !== 'playing' || !letters) return

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
        setScore(prev => prev + points)
        setFoundWords(prev => [...prev, word])
        setLastWord({ word, points })
        setFlash('correct')
        setTimeout(() => { setFlash(null); setLastWord(null) }, 800)
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
  }, [getLetterAtPoint, letters, dict, foundWords, phase])

  const currentWord = letters ? selected.map(i => letters[i]).join('') : ''
  const timerUrgent = timeLeft <= 10

  // SVG lines
  function getLinePoints() {
    if (selected.length < 2) return []
    const lineArr = []
    for (let i = 1; i < selected.length; i++) {
      const a = letterRefs.current[selected[i - 1]]
      const b = letterRefs.current[selected[i]]
      if (!a || !b || !circleRef.current) continue
      const cr = circleRef.current.getBoundingClientRect()
      const ar = a.getBoundingClientRect()
      const br = b.getBoundingClientRect()
      lineArr.push({
        x1: ar.left + ar.width / 2 - cr.left,
        y1: ar.top + ar.height / 2 - cr.top,
        x2: br.left + br.width / 2 - cr.left,
        y2: br.top + br.height / 2 - cr.top,
      })
    }
    return lineArr
  }

  const lines = selected.length >= 2 ? getLinePoints() : []

  // Loading dict
  if (!dict) {
    return (
      <div className="wg" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="wg-loading-content">
          <div className="wg-loading-text">Se încarcă dicționarul...</div>
        </div>
      </div>
    )
  }

  // Setup screen — choose duration
  if (phase === 'setup') {
    return (
      <div className="wg" style={{ backgroundImage: `url(${bgImage})` }}>
        <button className="wg-quit" onClick={onQuit}>✕</button>
        <div className="wg-setup">
          <h2 className="wg-setup-title">Războiul Cuvintelor</h2>
          <p className="wg-setup-desc">Formează cât mai multe cuvinte din literele de pe rotiță!</p>
          <p className="wg-setup-hint">1 punct per literă</p>
          <div className="wg-setup-options">
            <button className="wg-setup-btn" onClick={() => startGame(30)}>
              <span className="wg-setup-time">30s</span>
              <span className="wg-setup-label">Rapid</span>
            </button>
            <button className="wg-setup-btn" onClick={() => startGame(60)}>
              <span className="wg-setup-time">60s</span>
              <span className="wg-setup-label">Clasic</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="wg" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="wg-header">
        <button className="wg-quit" onClick={onQuit}>✕</button>
        <div className="wg-level">
          <span className="wg-level-icon">🔤</span>
          <span>Războiul Cuvintelor</span>
        </div>
        <div className={`wg-timer ${timerUrgent ? 'wg-timer-urgent' : ''}`}>
          {timeLeft}s
        </div>
      </div>

      <div className="wg-score-bar">
        <span className="wg-found">{foundWords.length} cuvinte</span>
        <span className="wg-total-score">⭐ {score} puncte</span>
      </div>

      {/* Found words list */}
      <div className="wg-words-list">
        {foundWords.length === 0 ? (
          <div className="wg-words-empty">Formează cuvinte din litere!</div>
        ) : (
          foundWords.slice().reverse().map((w, i) => (
            <span key={i} className="wg-word-tag">
              {w} <small>+{w.length}</small>
            </span>
          ))
        )}
      </div>

      {/* Current word display */}
      <div className={`wg-current ${shake ? 'wg-shake' : ''} ${flash === 'correct' ? 'wg-flash-correct' : flash === 'wrong' ? 'wg-flash-wrong' : ''}`}>
        {currentWord || (lastWord ? `${lastWord.word} +${lastWord.points}` : '···')}
      </div>

      {/* Letter Circle */}
      <div className="wg-circle-area">
        <div className="wg-circle" ref={circleRef}>
          <svg className="wg-lines">
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
                className={`wg-letter ${isSelected ? 'wg-letter-selected' : ''}`}
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

      {/* Shuffle only */}
      <div className="wg-controls">
        <button className="wg-ctrl-btn" onClick={shuffleLetters} title="Amestecă">
          🔀
        </button>
      </div>

      {/* Time's up overlay */}
      {timeLeft === 0 && (
        <div className="wg-complete-overlay">
          <span className="wg-complete-icon">⏰</span>
          <span className="wg-complete-text">Timpul a expirat!</span>
          <span className="wg-complete-score">{score} puncte · {foundWords.length} cuvinte</span>
        </div>
      )}
    </div>
  )
}
