import { useState } from 'react'
import './UsernameScreen.css'

export default function UsernameScreen({ onSave }) {
  const [name, setName] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    const trimmed = name.trim().slice(0, 16)
    localStorage.setItem('username', trimmed)
    onSave(trimmed)
  }

  return (
    <div className="username-screen">
      <div className="username-bg-orb username-orb-1" />
      <div className="username-bg-orb username-orb-2" />

      <form className="username-content" onSubmit={handleSubmit}>
        <div className="username-icon">👤</div>
        <h1 className="username-title">Cum te cheamă?</h1>
        <p className="username-subtitle">Alege un nume de jucător</p>

        <input
          className="username-input"
          type="text"
          maxLength={16}
          placeholder="Numele tău..."
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          autoCapitalize="words"
          autoComplete="off"
        />

        <button
          className="username-btn"
          type="submit"
          disabled={!name.trim()}
        >
          Hai la joc!
        </button>
      </form>
    </div>
  )
}
