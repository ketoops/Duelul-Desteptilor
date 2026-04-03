import { useState, useEffect } from 'react'
import './App.css'
import { applyTheme, getSavedTheme } from './services/themes'
import { getUserId, ensureUserProfile } from './services/userService'
import UsernameScreen from './components/UsernameScreen'
import HomeScreen from './components/HomeScreen'
import GameScreen from './components/GameScreen'
import ResultScreen from './components/ResultScreen'
import VsLobbyScreen from './components/VsLobbyScreen'
import VsOnlineScreen from './components/VsOnlineScreen'
import VsWordsScreen from './components/VsWordsScreen'
import SettingsScreen from './components/SettingsScreen'
import FriendsScreen from './components/FriendsScreen'
import WordGameScreen from './components/WordGameScreen'
import WallScreen from './components/WallScreen'
import LeaderboardScreen from './components/LeaderboardScreen'
import { submitScore } from './services/leaderboardService'

function App() {
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '')
  const [screen, setScreen] = useState('home')
  const [gameMode, setGameMode] = useState(null)
  const [result, setResult] = useState(null)
  const [roomCode, setRoomCode] = useState(null)
  const [playerSlot, setPlayerSlot] = useState(null)
  const [roomGameType, setRoomGameType] = useState(null)

  // Apply saved theme on mount
  useEffect(() => {
    applyTheme(getSavedTheme())
  }, [])

  // Ensure user profile exists in Firebase
  useEffect(() => {
    if (username) {
      ensureUserProfile(username)
    }
  }, [username])

  if (!username) {
    return <UsernameScreen onSave={setUsername} />
  }

  function startGame(mode) {
    if (mode === 'vs') {
      setScreen('vsLobby')
      setGameMode('vs')
      setRoomGameType('trivia')
      return
    }
    if (mode === 'vsWords') {
      setScreen('vsLobby')
      setGameMode('vs')
      setRoomGameType('words')
      return
    }
    if (mode === 'words') {
      setGameMode('words')
      setResult(null)
      setScreen('wordGame')
      return
    }
    setGameMode(mode)
    setResult(null)
    setScreen('game')
  }

  function handleRoomReady(code, slot, gameType) {
    setRoomCode(code)
    setPlayerSlot(slot)
    setRoomGameType(gameType)
    setScreen(gameType === 'words' ? 'vsWords' : 'vsOnline')
  }

  function endGame(gameResult) {
    setResult(gameResult)
    setScreen('result')

    // Save to leaderboard
    const { mode, score, wordsFound, vsScores, vsNames, gameDuration } = gameResult
    if (mode === 'words') {
      const type = gameDuration === 30 ? 'words30' : 'words60'
      submitScore(type, { score, wordsFound, username })
    } else if (mode === 'normal' || mode === 'test') {
      submitScore('trivia', { score, username })
    } else if (mode === 'vs') {
      // Save winner's score for VS leaderboards
      const myIndex = vsNames?.indexOf(username)
      if (myIndex !== -1 && vsScores) {
        const myScore = vsScores[myIndex]
        const gameType = gameResult.vsWordsFound ? 'vsWords' : 'vsTrivia'
        submitScore(gameType, { score: myScore, username })
      }
    }
  }

  function goHome() {
    setScreen('home')
    setGameMode(null)
    setResult(null)
    setRoomCode(null)
    setPlayerSlot(null)
    setRoomGameType(null)
  }

  if (screen === 'wordGame') {
    return <WordGameScreen onEnd={endGame} onQuit={goHome} />
  }

  if (screen === 'settings') {
    return <SettingsScreen onBack={goHome} />
  }

  if (screen === 'friends') {
    return <FriendsScreen username={username} onBack={goHome} />
  }

  if (screen === 'wall') {
    return <WallScreen onBack={goHome} />
  }

  if (screen === 'leaderboard') {
    return <LeaderboardScreen onBack={goHome} />
  }

  if (screen === 'vsLobby') {
    return <VsLobbyScreen username={username} gameType={roomGameType} onRoomReady={handleRoomReady} onBack={goHome} />
  }

  if (screen === 'vsWords') {
    return (
      <VsWordsScreen
        roomCode={roomCode}
        playerSlot={playerSlot}
        username={username}
        onEnd={endGame}
        onQuit={goHome}
      />
    )
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

  return (
    <HomeScreen
      username={username}
      onStart={startGame}
      onSettings={() => setScreen('settings')}
      onLeaderboard={() => setScreen('leaderboard')}
      onFriends={() => setScreen('friends')}
      onWall={() => setScreen('wall')}
    />
  )
}

export default App
