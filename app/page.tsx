'use client'

import { useState, useEffect, useCallback } from 'react'

type GameMode = 'realistic' | 'animated' | 'normal'

interface HorrorCharacter {
  id: string
  name: string
  emoji: string
  x: number
  y: number
  found: boolean
}

interface Room {
  x: number
  y: number
  width: number
  height: number
  type: string
}

const HORROR_CHARACTERS = [
  { id: '1', name: 'Pennywise', emoji: '🤡' },
  { id: '2', name: 'Michael Myers', emoji: '🔪' },
  { id: '3', name: 'Freddy Krueger', emoji: '😈' },
]

// Game constants
const GAME_DURATION_SECONDS = 180
const PLAYER_SPEED = 10
const COLLISION_THRESHOLD = 30
const PLAYER_MIN_X = 20
const PLAYER_MAX_X = 780
const PLAYER_MIN_Y = 20
const PLAYER_MAX_Y = 550

export default function Home() {
  const [playerName, setPlayerName] = useState('')
  const [gameStarted, setGameStarted] = useState(false)
  const [gameMode, setGameMode] = useState<GameMode>('normal')
  const [playerX, setPlayerX] = useState(50)
  const [playerY, setPlayerY] = useState(50)
  const [characters, setCharacters] = useState<HorrorCharacter[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS)
  const [gameOver, setGameOver] = useState(false)

  // Generate random house layout
  const generateHouse = useCallback(() => {
    const newRooms: Room[] = []
    const numRooms = 6 + Math.floor(Math.random() * 4)
    
    for (let i = 0; i < numRooms; i++) {
      newRooms.push({
        x: Math.random() * 600 + 50,
        y: Math.random() * 400 + 50,
        width: 80 + Math.random() * 120,
        height: 80 + Math.random() * 100,
        type: ['Kitchen', 'Bedroom', 'Bathroom', 'Living Room', 'Basement', 'Attic'][Math.floor(Math.random() * 6)]
      })
    }
    setRooms(newRooms)
  }, [])

  // Place horror characters randomly
  const placeCharacters = useCallback(() => {
    const newCharacters = HORROR_CHARACTERS.map(char => ({
      ...char,
      x: Math.random() * 700 + 50,
      y: Math.random() * 500 + 50,
      found: false
    }))
    setCharacters(newCharacters)
  }, [])

  // Start game
  const startGame = () => {
    if (playerName.trim()) {
      setGameStarted(true)
      setScore(0)
      setTimeLeft(GAME_DURATION_SECONDS)
      setGameOver(false)
      generateHouse()
      placeCharacters()
    }
  }

  // Handle keyboard movement
  useEffect(() => {
    if (!gameStarted || gameOver) return

    const handleKeyPress = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'ArrowUp':
        case 'w':
          setPlayerY(prev => Math.max(PLAYER_MIN_Y, prev - PLAYER_SPEED))
          break
        case 'ArrowDown':
        case 's':
          setPlayerY(prev => Math.min(PLAYER_MAX_Y, prev + PLAYER_SPEED))
          break
        case 'ArrowLeft':
        case 'a':
          setPlayerX(prev => Math.max(PLAYER_MIN_X, prev - PLAYER_SPEED))
          break
        case 'ArrowRight':
        case 'd':
          setPlayerX(prev => Math.min(PLAYER_MAX_X, prev + PLAYER_SPEED))
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameStarted, gameOver])

  // Timer countdown
  useEffect(() => {
    if (!gameStarted || gameOver) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, gameOver])

  // Check for character collision
  useEffect(() => {
    if (!gameStarted || gameOver) return

    characters.forEach((char, index) => {
      if (!char.found) {
        const distance = Math.sqrt(
          Math.pow(playerX - char.x, 2) + Math.pow(playerY - char.y, 2)
        )
        if (distance < COLLISION_THRESHOLD) {
          setCharacters(prev => {
            const updated = [...prev]
            updated[index].found = true
            return updated
          })
          setScore(prev => prev + 100)
        }
      }
    })

    // Check if all characters found
    if (characters.length > 0 && characters.every(c => c.found)) {
      setGameOver(true)
    }
  }, [playerX, playerY, characters, gameStarted, gameOver])

  // Get mode-specific styling
  const getModeStyle = () => {
    switch(gameMode) {
      case 'realistic':
        return {
          bg: 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900',
          text: 'text-gray-100',
          player: '👤',
          scary: 'opacity-90'
        }
      case 'animated':
        return {
          bg: 'bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400',
          text: 'text-white',
          player: '😊',
          scary: 'opacity-100'
        }
      case 'normal':
        return {
          bg: 'bg-gradient-to-br from-black via-red-950 to-black',
          text: 'text-red-100',
          player: '💀',
          scary: 'opacity-100 animate-pulse'
        }
    }
  }

  const style = getModeStyle()

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-red-900 flex items-center justify-center p-4">
        <div className="bg-black bg-opacity-80 p-8 rounded-2xl shadow-2xl max-w-md w-full border-2 border-red-600">
          <h1 className="text-5xl font-bold text-center mb-2 text-red-500" style={{ textShadow: '0 0 10px #ff0000' }}>
            👻 Horror Finder 👻
          </h1>
          <p className="text-center text-gray-300 mb-6 text-sm">
            Find all the horror characters before time runs out!
          </p>
          
          <div className="mb-6">
            <label className="block text-white mb-2 font-semibold">Enter Your Name:</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
              placeholder="Your name..."
              onKeyPress={(e) => e.key === 'Enter' && startGame()}
            />
          </div>

          <div className="mb-6">
            <label className="block text-white mb-2 font-semibold">Select Game Mode:</label>
            <div className="space-y-2">
              <button
                onClick={() => setGameMode('realistic')}
                className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${
                  gameMode === 'realistic'
                    ? 'bg-gray-600 text-white border-2 border-white'
                    : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600'
                }`}
              >
                🏚️ Realistic Mode
              </button>
              <button
                onClick={() => setGameMode('animated')}
                className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${
                  gameMode === 'animated'
                    ? 'bg-purple-600 text-white border-2 border-white'
                    : 'bg-purple-700 text-gray-300 border-2 border-purple-600 hover:bg-purple-600'
                }`}
              >
                🎨 Animated Mode
              </button>
              <button
                onClick={() => setGameMode('normal')}
                className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${
                  gameMode === 'normal'
                    ? 'bg-red-600 text-white border-2 border-white'
                    : 'bg-red-700 text-gray-300 border-2 border-red-600 hover:bg-red-600'
                }`}
              >
                💀 Normal Mode (Scary!)
              </button>
            </div>
          </div>

          <button
            onClick={startGame}
            disabled={!playerName.trim()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg text-xl transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg"
          >
            Start Game
          </button>

          <div className="mt-6 text-center text-gray-400 text-sm">
            <p className="mb-2">🎮 Use Arrow Keys or WASD to move</p>
            <p>Find: {HORROR_CHARACTERS.map(c => c.emoji + ' ' + c.name).join(', ')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${style.bg} p-4`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-black bg-opacity-70 rounded-lg p-4 mb-4 flex justify-between items-center">
          <div className="flex gap-6 items-center">
            <h2 className={`text-2xl font-bold ${style.text}`}>
              Player: {playerName}
            </h2>
            <div className={`text-xl font-semibold ${style.text}`}>
              Score: {score}
            </div>
            <div className={`text-xl font-semibold ${timeLeft < 30 ? 'text-red-500 animate-pulse' : style.text}`}>
              Time: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
          <div className="flex gap-2">
            {HORROR_CHARACTERS.map((char) => {
              const found = characters.find(c => c.id === char.id)?.found
              return (
                <div
                  key={char.id}
                  className={`text-2xl ${found ? 'opacity-50 grayscale' : 'opacity-100'}`}
                  title={char.name}
                >
                  {char.emoji}
                </div>
              )
            })}
          </div>
        </div>

        {/* Game Area */}
        <div className="bg-black bg-opacity-50 rounded-lg p-4 relative" style={{ height: '600px' }}>
          {/* House rooms */}
          {rooms.map((room, index) => (
            <div
              key={index}
              className="absolute border-2 border-gray-600 bg-gray-800 bg-opacity-40 rounded flex items-center justify-center"
              style={{
                left: `${room.x}px`,
                top: `${room.y}px`,
                width: `${room.width}px`,
                height: `${room.height}px`,
              }}
            >
              <span className="text-xs text-gray-400 opacity-70">{room.type}</span>
            </div>
          ))}

          {/* Horror characters */}
          {characters.map((char) => (
            !char.found && (
              <div
                key={char.id}
                className={`absolute text-4xl ${style.scary}`}
                style={{
                  left: `${char.x}px`,
                  top: `${char.y}px`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {char.emoji}
              </div>
            )
          ))}

          {/* Player */}
          <div
            className="absolute text-4xl transition-all duration-100"
            style={{
              left: `${playerX}px`,
              top: `${playerY}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {style.player}
          </div>

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <h2 className="text-5xl font-bold mb-4 text-red-500">
                  {characters.every(c => c.found) ? '🎉 You Won! 🎉' : '⏰ Time\'s Up! ⏰'}
                </h2>
                <p className="text-2xl text-white mb-2">
                  Final Score: {score}
                </p>
                <p className="text-xl text-gray-300 mb-6">
                  Found: {characters.filter(c => c.found).length} / {characters.length} characters
                </p>
                <button
                  onClick={() => {
                    setGameStarted(false)
                    setPlayerX(50)
                    setPlayerY(50)
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls Info */}
        <div className="bg-black bg-opacity-70 rounded-lg p-3 mt-4 text-center">
          <p className={`text-sm ${style.text}`}>
            🎮 Use Arrow Keys or WASD to move • Find all horror characters to win!
          </p>
        </div>
      </div>
    </div>
  )
}
