import { useState } from 'react'
import './App.css'
import HomeScreen from './components/HomeScreen'
import GameScreen from './components/GameScreen'
import ResultScreen from './components/ResultScreen'

function App() {
  const [screen, setScreen] = useState('home')
  const [gameMode, setGameMode] = useState(null)
  const [result, setResult] = useState(null)

  function startGame(mode) {
    setGameMode(mode)
    setResult(null)
    setScreen('game')
  }

  function endGame(gameResult) {
    setResult(gameResult)
    setScreen('result')
  }

  function goHome() {
    setScreen('home')
    setGameMode(null)
    setResult(null)
  }

  if (screen === 'game') {
    return <GameScreen mode={gameMode} onEnd={endGame} onQuit={goHome} />
  }

  if (screen === 'result') {
    return <ResultScreen result={result} onRestart={() => startGame(gameMode)} onHome={goHome} />
  }

  return <HomeScreen onStart={startGame} />
}

export default App
