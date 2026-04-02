import { useState, useEffect } from 'react'
import { listenToHistory } from '../services/userService'
import './WallScreen.css'

function timeAgo(timestamp) {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Acum'
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}z`
}

export default function WallScreen({ onBack }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = listenToHistory((entries) => {
      setHistory(entries)
      setLoading(false)
    })
    return unsub
  }, [])

  const myName = localStorage.getItem('username')

  return (
    <div className="wall">
      <div className="wall-header">
        <button className="wall-back" onClick={onBack}>← Înapoi</button>
        <h2 className="wall-title">⚔️ Arena</h2>
      </div>

      {loading ? (
        <div className="wall-empty">Se încarcă...</div>
      ) : history.length === 0 ? (
        <div className="wall-empty">
          <span className="wall-empty-icon">⚔️</span>
          <p>Niciun duel încă.</p>
          <p className="wall-empty-hint">Provoacă un prieten la 1v1!</p>
        </div>
      ) : (
        <div className="wall-feed">
          {history.map(entry => {
            const iWon = entry.winner === myName
            const isDraw = entry.winner === 'Egalitate'

            return (
              <div key={entry.id} className="wall-card">
                <div className="wall-card-top">
                  <span className="wall-time">{timeAgo(entry.date)}</span>
                  <span className={`wall-badge ${iWon ? 'badge-win' : isDraw ? 'badge-draw' : 'badge-lose'}`}>
                    {iWon ? '🏆 Victorie' : isDraw ? '🤝 Egalitate' : '💀 Înfrângere'}
                  </span>
                </div>

                <div className="wall-matchup">
                  <div className={`wall-player ${entry.player1 === myName ? 'wall-player-me' : ''}`}>
                    <span className="wall-player-name">{entry.player1}</span>
                    <span className="wall-player-score">{entry.score1}</span>
                  </div>
                  <span className="wall-vs">VS</span>
                  <div className={`wall-player ${entry.player2 === myName ? 'wall-player-me' : ''}`}>
                    <span className="wall-player-score">{entry.score2}</span>
                    <span className="wall-player-name">{entry.player2}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
