import { useState, useEffect } from 'react'
import { getFriendCode, addFriend, listenToFriends, removeFriend } from '../services/userService'
import './FriendsScreen.css'

export default function FriendsScreen({ username, onBack }) {
  const [friends, setFriends] = useState([])
  const [inputCode, setInputCode] = useState('')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const myCode = getFriendCode()

  useEffect(() => {
    const unsub = listenToFriends(setFriends)
    return unsub
  }, [])

  async function handleAdd() {
    if (inputCode.length < 6) return
    setLoading(true)
    setMessage(null)
    try {
      const name = await addFriend(inputCode)
      setMessage({ type: 'ok', text: `${name} adăugat!` })
      setInputCode('')
    } catch (err) {
      setMessage({ type: 'err', text: err.message })
    }
    setLoading(false)
  }

  async function handleRemove(id, name) {
    await removeFriend(id)
    setMessage({ type: 'ok', text: `${name} eliminat.` })
  }

  function copyCode() {
    navigator.clipboard?.writeText(myCode)
    setMessage({ type: 'ok', text: 'Cod copiat!' })
    setTimeout(() => setMessage(null), 2000)
  }

  return (
    <div className="friends">
      <div className="friends-header">
        <button className="friends-back" onClick={onBack}>← Înapoi</button>
        <h2 className="friends-title">Prieteni</h2>
      </div>

      {/* My code */}
      <div className="my-code-section">
        <span className="my-code-label">Codul tău de prieten</span>
        <div className="my-code-row">
          <span className="my-code">{myCode}</span>
          <button className="copy-btn" onClick={copyCode}>Copiază</button>
        </div>
        <span className="my-code-hint">Trimite acest cod prietenilor tăi</span>
      </div>

      {/* Add friend */}
      <div className="add-friend-section">
        <span className="section-label">Adaugă prieten</span>
        <div className="add-friend-row">
          <input
            className="friend-code-input"
            type="text"
            maxLength={6}
            placeholder="CODUL..."
            value={inputCode}
            onChange={e => setInputCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            autoCapitalize="characters"
          />
          <button
            className="add-btn"
            onClick={handleAdd}
            disabled={loading || inputCode.length < 6}
          >
            {loading ? '...' : 'Adaugă'}
          </button>
        </div>
        {message && (
          <p className={`friend-msg ${message.type === 'ok' ? 'msg-ok' : 'msg-err'}`}>
            {message.text}
          </p>
        )}
      </div>

      {/* Friends list */}
      <div className="friends-list-section">
        <span className="section-label">Prietenii tăi ({friends.length})</span>
        {friends.length === 0 ? (
          <p className="no-friends">Niciun prieten încă. Trimite codul tău!</p>
        ) : (
          <div className="friends-list">
            {friends.map(f => (
              <div key={f.id} className="friend-card">
                <span className="friend-avatar">👤</span>
                <span className="friend-name">{f.name}</span>
                <button
                  className="friend-remove"
                  onClick={() => handleRemove(f.id, f.name)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
