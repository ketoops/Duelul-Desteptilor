import { useState, useEffect } from 'react'
import { getLeaderboard } from '../services/leaderboardService'
import { getUserId } from '../services/userService'
import './LeaderboardScreen.css'

const TABS = [
  { key: 'words60', label: 'Cuvinte 60s', icon: '🔤' },
  { key: 'words30', label: 'Cuvinte 30s', icon: '⚡' },
  { key: 'trivia', label: 'Capcană', icon: '🧠' },
  { key: 'vsTrivia', label: 'VS Trivia', icon: '⚔️' },
  { key: 'vsWords', label: 'VS Cuvinte', icon: '🔤' },
]

export default function LeaderboardScreen({ onBack }) {
  const [activeTab, setActiveTab] = useState('words60')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const myId = getUserId()

  useEffect(() => {
    setLoading(true)
    getLeaderboard(activeTab)
      .then(data => {
        setEntries(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [activeTab])

  function getMedal(rank) {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <div className="lb">
      <div className="lb-header">
        <button className="lb-back" onClick={onBack}>← Înapoi</button>
        <h1 className="lb-title">🏆 Clasament</h1>
      </div>

      <div className="lb-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`lb-tab ${activeTab === tab.key ? 'lb-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="lb-tab-icon">{tab.icon}</span>
            <span className="lb-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="lb-list">
        {loading ? (
          <div className="lb-empty">Se încarcă...</div>
        ) : entries.length === 0 ? (
          <div className="lb-empty">Niciun scor încă. Fii primul!</div>
        ) : (
          entries.map((entry, i) => {
            const rank = i + 1
            const isMe = entry.id === myId
            return (
              <div key={entry.id} className={`lb-row ${isMe ? 'lb-row-me' : ''} ${rank <= 3 ? 'lb-row-top' : ''}`}>
                <span className={`lb-rank ${rank <= 3 ? 'lb-rank-medal' : ''}`}>
                  {getMedal(rank)}
                </span>
                <div className="lb-info">
                  <span className="lb-name">{entry.name}{isMe ? ' (tu)' : ''}</span>
                  {entry.wordsFound && (
                    <span className="lb-words">{entry.wordsFound} cuvinte</span>
                  )}
                </div>
                <span className="lb-score">{entry.score}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
