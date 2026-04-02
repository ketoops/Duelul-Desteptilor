import './HomeScreen.css'

export default function HomeScreen({ onStart }) {
  return (
    <div className="home">
      <div className="home-bg-orb home-bg-orb-1" />
      <div className="home-bg-orb home-bg-orb-2" />

      <div className="home-content">
        <div className="home-logo">
          <span className="home-logo-icon">🧠</span>
          <div className="home-logo-ring" />
        </div>

        <h1 className="home-title">
          Duelul
          <span className="home-title-accent"> Deștepților</span>
        </h1>
        <p className="home-subtitle">
          Întrebări capcană. Fără variante. Fără milă.
        </p>

        <div className="home-modes">
          <button className="mode-card" onClick={() => onStart('normal')}>
            <div className="mode-card-glow mode-glow-purple" />
            <div className="mode-card-inner">
              <div className="mode-header">
                <span className="mode-icon">⚡</span>
                <span className="mode-badge">SOLO</span>
              </div>
              <span className="mode-name">Mod Normal</span>
              <span className="mode-desc">10 întrebări · 10 secunde · o singură șansă</span>
            </div>
          </button>

          <button className="mode-card" onClick={() => onStart('vs')}>
            <div className="mode-card-glow mode-glow-orange" />
            <div className="mode-card-inner">
              <div className="mode-header">
                <span className="mode-icon">⚔️</span>
                <span className="mode-badge badge-vs">ONLINE</span>
              </div>
              <span className="mode-name">1 vs 1</span>
              <span className="mode-desc">Provoacă un prieten — de pe orice telefon</span>
            </div>
          </button>
        </div>

        <p className="home-footer">Scrii răspunsul. Gândești repede. Sau pierzi.</p>
      </div>
    </div>
  )
}
