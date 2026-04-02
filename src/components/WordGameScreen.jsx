import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import puzzles from '../data/wordPuzzles.json'
import './WordGameScreen.css'

const GAME_TIME = 60

function buildGrid(puzzle) {
  const grid = Array.from({ length: puzzle.gridRows }, () =>
    Array.from({ length: puzzle.gridCols }, () => null)
  )
  puzzle.words.forEach(w => {
    for (let i = 0; i < w.word.length; i++) {
      const r = w.dir === 'v' ? w.row + i : w.row
      const c = w.dir === 'h' ? w.col + i : w.col
      grid[r][c] = w.word[i]
    }
  })
  return grid
}

export default function WordGameScreen({ onEnd, onQuit }) {
  const [puzzleIndex, setPuzzleIndex] = useState(0)
  const puzzle = puzzles[puzzleIndex]
  const grid = useMemo(() => buildGrid(puzzle), [puzzle])

  const [foundWords, setFoundWords] = useState([])
  const [selected, setSelected] = useState([])
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [shake, setShake] = useState(false)
  const [flash, setFlash] = useState(null)
  const [totalScore, setTotalScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const timerRef = useRef(null)
  const letterRefs = useRef([])
  const circleRef = useRef(null)
  const selectedRef = useRef([])
  const draggingRef = useRef(false)

  const allWords = puzzle.words.map(w => w.word)
  const allFound = foundWords.length === allWords.length

  // Timer
  useEffect(() => {
    setTimeLeft(GAME_TIME)
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
  }, [puzzleIndex])

  // Time up or all found
  useEffect(() => {
    if (timeLeft === 0 || allFound) {
      clearInterval(timerRef.current)
      const score = foundWords.length
      const newTotal = totalScore + score + (allFound ? Math.floor(timeLeft / 5) : 0)
      setTotalScore(newTotal)

      setTimeout(() => {
        const nextIndex = puzzleIndex + 1
        if (nextIndex >= puzzles.length) {
          setGameOver(true)
        } else {
          setPuzzleIndex(nextIndex)
          setFoundWords([])
          setSelected([])
          setFlash(null)
        }
      }, allFound ? 1500 : 2000)
    }
  }, [timeLeft, allFound])

  useEffect(() => {
    if (gameOver) {
      onEnd({
        score: totalScore,
        total: puzzles.reduce((sum, p) => sum + p.words.length, 0),
        mode: 'words'
      })
    }
  }, [gameOver, totalScore, onEnd])

  // Find which letter index is at given coordinates
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

  // Keep refs in sync with state
  useEffect(() => { selectedRef.current = selected }, [selected])
  useEffect(() => { draggingRef.current = isDragging }, [isDragging])

  // Drag/swipe handlers
  function handlePointerDown(e, index) {
    e.preventDefault()
    setIsDragging(true)
    setSelected([index])
  }

  // Global move/up listeners — use refs to avoid stale closures
  useEffect(() => {
    function handlePointerMove(e) {
      if (!draggingRef.current) return
      e.preventDefault()

      const x = e.touches ? e.touches[0].clientX : e.clientX
      const y = e.touches ? e.touches[0].clientY : e.clientY
      const idx = getLetterAtPoint(x, y)

      if (idx >= 0) {
        const prev = selectedRef.current
        // Going back to second-to-last → undo last letter
        if (prev.length >= 2 && idx === prev[prev.length - 2]) {
          const next = prev.slice(0, -1)
          selectedRef.current = next
          setSelected(next)
        }
        // New letter not yet selected → add
        else if (!prev.includes(idx)) {
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
      const word = sel.map(i => puzzle.letters[i]).join('')
      if (allWords.includes(word) && !foundWords.includes(word)) {
        setFoundWords(prev => [...prev, word])
        setFlash('correct')
        setTimeout(() => setFlash(null), 600)
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
  }, [getLetterAtPoint, puzzle.letters, allWords, foundWords])

  function isCellRevealed(row, col) {
    for (const w of puzzle.words) {
      if (!foundWords.includes(w.word)) continue
      for (let i = 0; i < w.word.length; i++) {
        const r = w.dir === 'v' ? w.row + i : w.row
        const c = w.dir === 'h' ? w.col + i : w.col
        if (r === row && c === col) return true
      }
    }
    return false
  }

  const currentWord = selected.map(i => puzzle.letters[i]).join('')
  const timerUrgent = timeLeft <= 10

  // SVG lines between selected letters
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

  return (
    <div className="wg">
      <div className="wg-header">
        <button className="wg-quit" onClick={onQuit}>✕</button>
        <div className="wg-theme">
          <span className="wg-theme-icon">{puzzle.image}</span>
          <span>{puzzle.theme}</span>
        </div>
        <div className={`wg-timer ${timerUrgent ? 'wg-timer-urgent' : ''}`}>
          {timeLeft}s
        </div>
      </div>

      <div className="wg-score-bar">
        <span className="wg-found">{foundWords.length}/{allWords.length} cuvinte</span>
        <span className="wg-puzzle-num">Nivel {puzzleIndex + 1}/{puzzles.length}</span>
        <span className="wg-total-score">⭐ {totalScore}</span>
      </div>

      {/* Crossword Grid */}
      <div className="wg-grid-wrapper">
        <div className="wg-grid" style={{
          gridTemplateColumns: `repeat(${puzzle.gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${puzzle.gridRows}, 1fr)`
        }}>
          {grid.map((row, r) =>
            row.map((cell, c) => {
              if (!cell) return <div key={`${r}-${c}`} className="wg-cell wg-cell-empty" />
              const revealed = isCellRevealed(r, c)
              return (
                <div
                  key={`${r}-${c}`}
                  className={`wg-cell ${revealed ? 'wg-cell-revealed' : 'wg-cell-hidden'}`}
                >
                  {revealed ? cell : ''}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Current word display */}
      <div className={`wg-current ${shake ? 'wg-shake' : ''} ${flash === 'correct' ? 'wg-flash-correct' : flash === 'wrong' ? 'wg-flash-wrong' : ''}`}>
        {currentWord || '···'}
      </div>

      {/* Letter Circle with drag */}
      <div className="wg-circle-area">
        <div className="wg-circle" ref={circleRef}>
          {/* SVG connection lines */}
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

          {puzzle.letters.map((letter, i) => {
            const angle = (i / puzzle.letters.length) * 2 * Math.PI - Math.PI / 2
            const radius = 38
            const x = 50 + radius * Math.cos(angle)
            const y = 50 + radius * Math.sin(angle)
            const isSelected = selected.includes(i)

            return (
              <div
                key={`${puzzleIndex}-${i}`}
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

      {/* All found overlay */}
      {allFound && (
        <div className="wg-complete-overlay">
          <span className="wg-complete-icon">🎉</span>
          <span className="wg-complete-text">Completat!</span>
        </div>
      )}
    </div>
  )
}
