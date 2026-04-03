import { useState, useEffect } from 'react'
import geniusImg from '../assets/genius.png'
import { getLeaderboard } from '../services/leaderboardService'
import './HomeScreen.css'

const CHAMPION_CATEGORIES = [
  { key: 'words60', label: 'Cuvinte 60s', icon: '🔤' },
  { key: 'words30', label: 'Cuvinte 30s', icon: '⚡' },
  { key: 'trivia', label: 'Întrebări Capcană', icon: '🧠' },
  { key: 'vsTrivia', label: 'VS Trivia', icon: '⚔️' },
  { key: 'vsWords', label: 'VS Cuvinte', icon: '🔤' },
]

export default function HomeScreen({ username, onStart, onSettings, onLeaderboard, onFriends, onWall }) {
  const [champions, setChampions] = useState([])
  const [champIndex, setChampIndex] = useState(0)
  const [animating, setAnimating] = useState(false)

  // Load #1 player for each category
  useEffect(() => {
    async function loadChampions() {
      const results = []
      for (const cat of CHAMPION_CATEGORIES) {
        const entries = await getLeaderboard(cat.key)
        if (entries.length > 0) {
          results.push({
            ...cat,
            name: entries[0].name,
            score: entries[0].score,
          })
        }
      }
      setChampions(results)
    }
    loadChampions()
  }, [])

  // Rotate every 5s
  useEffect(() => {
    if (champions.length <= 1) return
    const interval = setInterval(() => {
      setAnimating(true)
      setTimeout(() => {
        setChampIndex(prev => (prev + 1) % champions.length)
        setAnimating(false)
      }, 400)
    }, 5000)
    return () => clearInterval(interval)
  }, [champions])

  const champ = champions[champIndex]

  return (
    <div className="home">
      <div className="home-bg-orb home-bg-orb-1" />
      <div className="home-bg-orb home-bg-orb-2" />

      <div className="home-content">
        <div className="home-topbar">
          <div className="home-welcome">Salut, <strong>{username}</strong></div>
          <div className="home-topbar-btns">
            <button className="home-topbar-btn" onClick={onLeaderboard}>🏆</button>
            <button className="home-topbar-btn" onClick={onSettings}>⚙️</button>
          </div>
        </div>

        <div className="home-mascot">
          <img src={geniusImg} alt="Genius" className="home-mascot-img" />
        </div>

        <h1 className="home-title">
          Duelul
          <span className="home-title-accent"> Deștepților</span>
        </h1>

        <p className="home-subtitle">Galeria Campionilor</p>

        {champ && (
          <div className="champion-ticker" onClick={onLeaderboard}>
            <div className={`champion-card ${animating ? 'champion-exit' : 'champion-enter'}`}>
              <span className="champion-medal">🥇</span>
              <span className="champion-icon">{champ.icon}</span>
              <span className="champion-name">{champ.name}</span>
              <span className="champion-divider">·</span>
              <span className="champion-score">{champ.score} pts</span>
              <span className="champion-cat">{champ.label}</span>
            </div>
          </div>
        )}

        <div className="home-modes">
          <button className="mode-btn mode-solo" onClick={() => onStart('normal')}>
            <span className="mode-btn-icon">⚡</span>
            <span className="mode-btn-label">Întrebări Capcană</span>
          </button>

          <button className="mode-btn mode-vs" onClick={() => onStart('vs')}>
            <span className="mode-btn-icon">⚔️</span>
            <span className="mode-btn-label">1 vs 1 Online</span>
          </button>
        </div>

        <div className="home-modes">
          <button className="mode-btn mode-words" onClick={() => onStart('words')}>
            <span className="mode-btn-icon">🔤</span>
            <span className="mode-btn-label">Cuvinte Solo</span>
          </button>

          <button className="mode-btn mode-vs-words" onClick={() => onStart('vsWords')}>
            <span className="mode-btn-icon">⚔️</span>
            <span className="mode-btn-label">Cuvinte 1v1</span>
          </button>
        </div>

        <div className="home-nav">
          <button className="nav-btn" onClick={onFriends}>
            <span className="nav-icon">👥</span>
            <span className="nav-label">Prieteni</span>
          </button>
          <button className="nav-btn" onClick={onWall}>
            <span className="nav-icon">⚔️</span>
            <span className="nav-label">Arena</span>
          </button>
          <button className="nav-btn" onClick={() => onStart('test')}>
            <span className="nav-icon">🧪</span>
            <span className="nav-label">Test</span>
          </button>
        </div>

        <p className="home-footer">Gândești repede. Sau pierzi.</p>
      </div>
    </div>
  )
}
