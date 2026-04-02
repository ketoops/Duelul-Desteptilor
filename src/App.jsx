import { useState } from 'react'
import './App.css'
import UsernameScreen from './components/UsernameScreen'
import HomeScreen from './components/HomeScreen'
import GameScreen from './components/GameScreen'
import ResultScreen from './components/ResultScreen'
import VsLobbyScreen from './components/VsLobbyScreen'
import VsOnlineScreen from './components/VsOnlineScreen'

function App() {
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '')
  const [screen, setScreen] = useState('home')
  const [gameMode, setGameMode] = useState(null)
  const [result, setResult] = useState(null)
  const [roomCode, setRoomCode] = useState(null)
  const [playerSlot, setPlayerSlot] = useState(null)

  if (!username) {
    return <UsernameScreen onSave={setUsername} />
  }

  function startGame(mode) {
    if (mode === 'vs') {
      setScreen('vsLobby')
      setGameMode('vs')
      return
    }
    setGameMode(mode)
    setResult(null)
    setScreen('game')
  }

  function handleRoomReady(code, slot) {
    setRoomCode(code)
    setPlayerSlot(slot)
    setScreen('vsOnline')
  }

  function endGame(gameResult) {
    setResult(gameResult)
    setScreen('result')
  }

  function goHome() {
    setScreen('home')
    setGameMode(null)
    setResult(null)
    setRoomCode(null)
    setPlayerSlot(null)
  }

  if (screen === 'vsLobby') {
    return <VsLobbyScreen username={username} onRoomReady={handleRoomReady} onBack={goHome} />
  }

  if (screen === 'vsOnline') {
    return (
      <VsOnlineScreen
        roomCode={roomCode}
        playerSlot={playerSlot}
        username={username}
        onEnd={endGame}
        onQuit={goHome}
      />
    )
  }

  if (screen === 'game') {
    return <GameScreen mode={gameMode} onEnd={endGame} onQuit={goHome} />
  }

  if (screen === 'result') {
    return (
      <ResultScreen
        result={result}
        onRestart={() => startGame(gameMode)}
        onHome={goHome}
      />
    )
  }

  return <HomeScreen username={username} onStart={startGame} />
}

export default App
