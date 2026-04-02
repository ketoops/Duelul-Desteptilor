import geniusImg from '../assets/genius.png'
import './HomeScreen.css'

export default function HomeScreen({ username, onStart }) {
  return (
    <div className="home">
      <div className="home-bg-orb home-bg-orb-1" />
      <div className="home-bg-orb home-bg-orb-2" />

      <div className="home-content">
        <div className="home-welcome">Salut, <strong>{username}</strong></div>

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
            <span className="mode-btn-label">Mod Normal</span>
          </button>

          <button className="mode-btn mode-vs" onClick={() => onStart('vs')}>
            <span className="mode-btn-icon">⚔️</span>
            <span className="mode-btn-label">1 vs 1 Online</span>
          </button>
        </div>

        <p className="home-footer">Scrii răspunsul. Gândești repede. Sau pierzi.</p>
      </div>
    </div>
  )
}
