import { useState } from 'react'
import { themes, applyTheme, getSavedTheme } from '../services/themes'
import './SettingsScreen.css'

export default function SettingsScreen({ onBack }) {
  const [currentTheme, setCurrentTheme] = useState(getSavedTheme())

  function selectTheme(id) {
    applyTheme(id)
    setCurrentTheme(id)
  }

  return (
    <div className="settings">
      <div className="settings-header">
        <button className="settings-back" onClick={onBack}>← Înapoi</button>
        <h2 className="settings-title">Setări</h2>
      </div>

      <div className="settings-section">
        <h3 className="section-label">Temă vizuală</h3>
        <div className="theme-grid">
          {Object.entries(themes).map(([id, theme]) => (
            <button
              key={id}
              className={`theme-card ${currentTheme === id ? 'theme-active' : ''}`}
              onClick={() => selectTheme(id)}
            >
              <span className="theme-icon">{theme.icon}</span>
              <span className="theme-name">{theme.name}</span>
              {currentTheme === id && <span className="theme-check">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
