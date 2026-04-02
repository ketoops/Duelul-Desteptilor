import { useState } from 'react'
import './App.css'
import HomeScreen from './components/HomeScreen'
import GameScreen from './components/GameScreen'
import ResultScreen from './components/ResultScreen'
import VsLobbyScreen from './components/VsLobbyScreen'
import VsOnlineScreen from './components/VsOnlineScreen'

function App() {
  const [screen, setScreen] = useState('home')
  const [gameMode, setGameMode] = useState(null)
  const [result, setResult] = useState(null)
  const [roomCode, setRoomCode] = useState(null)
  const [playerSlot, setPlayerSlot] = useState(null)

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
    return <VsLobbyScreen onRoomReady={handleRoomReady} onBack={goHome} />
  }

  if (screen === 'vsOnline') {
    return (
      <VsOnlineScreen
        roomCode={roomCode}
        playerSlot={playerSlot}
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

  return <HomeScreen onStart={startGame} />
}

export default App
