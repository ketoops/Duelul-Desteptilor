import './HomeScreen.css'

export default function HomeScreen({ onStart }) {
  return (
    <div className="home">
      <div className="home-content">
        <div className="home-emoji">🧠</div>
        <h1 className="home-title">Întrebări Capcană</h1>
        <p className="home-subtitle">
          Crezi că ești deștept? Dovedește-o.
        </p>

        <div className="home-modes">
          <button className="mode-btn mode-normal" onClick={() => onStart('normal')}>
            <span className="mode-icon">⚡</span>
            <div className="mode-info">
              <span className="mode-name">Normal</span>
              <span className="mode-desc">10 întrebări, o singură viață</span>
            </div>
          </button>

          <button className="mode-btn mode-vs" onClick={() => onStart('vs')}>
            <span className="mode-icon">⚔️</span>
            <div className="mode-info">
              <span className="mode-name">1 vs 1</span>
              <span className="mode-desc">Provoacă un prieten</span>
            </div>
          </button>
        </div>

        <p className="home-hint">Scrii răspunsul. Fără variante. Fără milă.</p>
      </div>
    </div>
  )
}
