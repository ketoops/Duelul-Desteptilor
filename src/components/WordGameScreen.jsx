import { useState, useEffect, useRef, useMemo } from 'react'
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
  const [flash, setFlash] = useState(null) // 'correct' | 'wrong'
  const [totalScore, setTotalScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const timerRef = useRef(null)

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

  // Time up or all found → next puzzle or end
  useEffect(() => {
    if (timeLeft === 0 || allFound) {
      clearInterval(timerRef.current)
      const score = foundWords.length
      const newTotal = totalScore + score

      if (allFound) {
        // Bonus for finishing early
        setTotalScore(newTotal + Math.floor(timeLeft / 5))
      } else {
        setTotalScore(newTotal)
      }

      // Move to next puzzle or end
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

  // Game over
  useEffect(() => {
    if (gameOver) {
      onEnd({
        score: totalScore,
        total: puzzles.reduce((sum, p) => sum + p.words.length, 0),
        mode: 'words'
      })
    }
  }, [gameOver, totalScore, onEnd])

  function toggleLetter(index) {
    if (gameOver || timeLeft === 0) return

    if (selected.includes(index)) {
      // Deselect from this point on
      const pos = selected.indexOf(index)
      setSelected(selected.slice(0, pos))
    } else {
      setSelected([...selected, index])
    }
  }

  function submitWord() {
    const word = selected.map(i => puzzle.letters[i]).join('')

    if (allWords.includes(word) && !foundWords.includes(word)) {
      setFoundWords([...foundWords, word])
      setFlash('correct')
      setTimeout(() => setFlash(null), 600)
    } else {
      setShake(true)
      setFlash('wrong')
      setTimeout(() => { setShake(false); setFlash(null) }, 500)
    }
    setSelected([])
  }

  function clearSelection() {
    setSelected([])
  }

  const currentWord = selected.map(i => puzzle.letters[i]).join('')
  const timerUrgent = timeLeft <= 10

  // Check which cells are revealed
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

  return (
    <div className="wg">
      <div className="wg-header">
        <button className="wg-quit" onClick={onQuit}>✕</button>
        <div className="wg-theme">{puzzle.theme}</div>
        <div className={`wg-timer ${timerUrgent ? 'wg-timer-urgent' : ''}`}>
          {timeLeft}s
        </div>
      </div>

      <div className="wg-score-bar">
        <span className="wg-found">{foundWords.length}/{allWords.length} cuvinte</span>
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

      {/* Letter Circle */}
      <div className="wg-circle-area">
        <div className="wg-circle">
          {puzzle.letters.map((letter, i) => {
            const angle = (i / puzzle.letters.length) * 2 * Math.PI - Math.PI / 2
            const radius = 38
            const x = 50 + radius * Math.cos(angle)
            const y = 50 + radius * Math.sin(angle)
            const isSelected = selected.includes(i)

            return (
              <button
                key={i}
                className={`wg-letter ${isSelected ? 'wg-letter-selected' : ''}`}
                style={{ left: `${x}%`, top: `${y}%` }}
                onClick={() => toggleLetter(i)}
              >
                {letter}
              </button>
            )
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="wg-actions">
        <button className="wg-action-btn wg-clear" onClick={clearSelection}>
          Șterge
        </button>
        <button
          className="wg-action-btn wg-submit"
          onClick={submitWord}
          disabled={selected.length < 2}
        >
          Verifică
        </button>
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
