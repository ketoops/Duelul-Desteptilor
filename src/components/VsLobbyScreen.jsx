import { useState } from 'react'
import { createRoom, joinRoom } from '../services/roomService'
import './VsLobbyScreen.css'

export default function VsLobbyScreen({ onRoomReady, onBack }) {
  const [view, setView] = useState('choice') // choice | create | join
  const [roomCode, setRoomCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    setError('')
    try {
      const code = await createRoom()
      setRoomCode(code)
      setView('create')
      onRoomReady(code, 'player1')
    } catch {
      setError('Eroare la creare. Încearcă din nou.')
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!inputCode.trim()) return
    setLoading(true)
    setError('')
    try {
      await joinRoom(inputCode.toUpperCase())
      onRoomReady(inputCode.toUpperCase(), 'player2')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (view === 'create') {
    return (
      <div className="lobby">
        <div className="lobby-content">
          <div className="lobby-emoji">⏳</div>
          <h2 className="lobby-title">Așteaptă adversarul</h2>
          <div className="room-code">{roomCode}</div>
          <p className="lobby-hint">Trimite codul prietenului tău</p>
        </div>
      </div>
    )
  }

  return (
    <div className="lobby">
      <div className="lobby-content">
        {view === 'choice' ? (
          <>
            <div className="lobby-emoji">⚔️</div>
            <h2 className="lobby-title">1 vs 1 Online</h2>

            <div className="lobby-actions">
              <button className="lobby-btn create-btn" onClick={handleCreate} disabled={loading}>
                {loading ? 'Se creează...' : 'Creează cameră'}
              </button>
              <div className="lobby-divider">sau</div>
              <button className="lobby-btn join-btn" onClick={() => setView('join')}>
                Intră cu cod
              </button>
            </div>

            <button className="back-link" onClick={onBack}>← Înapoi</button>
          </>
        ) : (
          <>
            <div className="lobby-emoji">🔑</div>
            <h2 className="lobby-title">Introdu codul</h2>

            <input
              className="code-input"
              type="text"
              maxLength={5}
              placeholder="XXXXX"
              value={inputCode}
              onChange={e => setInputCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              autoFocus
              autoCapitalize="characters"
            />

            {error && <p className="lobby-error">{error}</p>}

            <button
              className="lobby-btn join-btn"
              onClick={handleJoin}
              disabled={loading || inputCode.length < 5}
            >
              {loading ? 'Se conectează...' : 'Intră în cameră'}
            </button>

            <button className="back-link" onClick={() => { setView('choice'); setError('') }}>
              ← Înapoi
            </button>
          </>
        )}
      </div>
    </div>
  )
}
