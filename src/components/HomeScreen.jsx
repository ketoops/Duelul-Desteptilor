import geniusImg from '../assets/genius.png'
import './HomeScreen.css'

export default function HomeScreen({ username, onStart, onSettings, onLeaderboard, onFriends, onWall }) {
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
        <p className="home-subtitle">
          Întrebări capcană. Fără variante. Fără milă.
        </p>

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
