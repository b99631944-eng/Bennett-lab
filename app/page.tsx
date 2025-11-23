'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

type GameMode = 'realistic' | 'animated' | 'normal' | 'elf-find' | 'obby' | 'secret-santa'

interface HorrorCharacter {
  id: string
  name: string
  emoji: string
  x: number
  y: number
  found: boolean
  points?: number
}

interface Room {
  x: number
  y: number
  width: number
  height: number
  type: string
}

interface Platform {
  x: number
  y: number
  width: number
  height: number
  isFinish?: boolean
}

// Game constants
const GAME_DURATION_SECONDS = 180
const ELF_GAME_DURATION_SECONDS = 59
const OBBY_GAME_DURATION_SECONDS = 120
const PLAYER_SPEED = 10
const COLLISION_THRESHOLD = 30
const PLAYER_MIN_X = 20
const PLAYER_MAX_X = 780
const PLAYER_MIN_Y = 20
const PLAYER_MAX_Y = 550
const SANTA_POINTS = 10000000000
const DEFAULT_CHARACTER_POINTS = 100
const OBBY_COMPLETION_POINTS = 100
const MIN_PLATFORMS = 8
const PLATFORM_COUNT_RANGE = 3
const PLAYER_HITBOX_SIZE = 20
const JUMPSCARE_DURATION_MS = 2000

const HORROR_CHARACTERS = [
  { id: '1', name: 'Pennywise', emoji: '🤡' },
  { id: '2', name: 'Michael Myers', emoji: '🔪' },
  { id: '3', name: 'Freddy Krueger', emoji: '😈' },
]

const ELF_CHARACTERS = [
  { id: '1', name: 'Elf Helper', emoji: '🧝' },
  { id: '2', name: 'Elf Worker', emoji: '🧝‍♀️' },
  { id: '3', name: 'Elf Builder', emoji: '🧝‍♂️' },
  { id: '4', name: 'Santa Claus', emoji: '🎅', points: SANTA_POINTS },
]

const SECRET_SANTA_PARTICIPANTS = [
  'Bennett', 'Hendrix', 'Isaac', 'Vince', 'Daniel', 
  'Addie', 'Owen', 'Evie', 'Simon', 'Hannah', 'Marina'
]

export default function Home() {
  const [playerName, setPlayerName] = useState('')
  const [gameStarted, setGameStarted] = useState(false)
  const [gameMode, setGameMode] = useState<GameMode>('normal')
  const [playerX, setPlayerX] = useState(50)
  const [playerY, setPlayerY] = useState(50)
  const [characters, setCharacters] = useState<HorrorCharacter[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [showJumpscare, setShowJumpscare] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS)
  const [gameOver, setGameOver] = useState(false)
  const jumpscareTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Secret Santa state
  const [secretSantaAssignment, setSecretSantaAssignment] = useState<string | null>(null)
  const [availableNames, setAvailableNames] = useState<string[]>([])
  const [pickedNames, setPickedNames] = useState<string[]>([])

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

  // Generate obstacle course for obby mode
  const generateObby = useCallback(() => {
    const newPlatforms: Platform[] = []
    
    // Starting platform
    newPlatforms.push({
      x: 50,
      y: 500,
      width: 120,
      height: 30
    })
    
    // Generate 8-10 platforms in a challenging path
    const numPlatforms = MIN_PLATFORMS + Math.floor(Math.random() * PLATFORM_COUNT_RANGE)
    let currentX = 200
    let currentY = 480
    
    for (let i = 0; i < numPlatforms; i++) {
      // Vary the position to create jumps
      currentX += 60 + Math.random() * 80
      currentY = 200 + Math.random() * 300
      
      const platformWidth = 60 + Math.random() * 60
      const platformHeight = 20 + Math.random() * 15
      
      newPlatforms.push({
        x: currentX,
        y: currentY,
        width: platformWidth,
        height: platformHeight
      })
    }
    
    // Final platform (finish line)
    newPlatforms.push({
      x: currentX + 120,
      y: currentY,
      width: 100,
      height: 40,
      isFinish: true
    })
    
    setPlatforms(newPlatforms)
  }, [])

  // Pick a Secret Santa name from the bucket
  const pickSecretSanta = useCallback(() => {
    if (availableNames.length === 0) {
      // Initialize or reset the bucket using Fisher-Yates shuffle
      const shuffled = [...SECRET_SANTA_PARTICIPANTS]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      setAvailableNames(shuffled)
      const picked = shuffled[0]
      setSecretSantaAssignment(picked)
      setPickedNames([picked])
      setAvailableNames(shuffled.slice(1))
    } else {
      // Pick from remaining names
      const picked = availableNames[0]
      setSecretSantaAssignment(picked)
      setPickedNames([...pickedNames, picked])
      setAvailableNames(availableNames.slice(1))
    }
  }, [availableNames, pickedNames])

  // Reset Secret Santa
  const resetSecretSanta = useCallback(() => {
    setSecretSantaAssignment(null)
    setAvailableNames([])
    setPickedNames([])
  }, [])

  // Place horror characters randomly
  const placeCharacters = useCallback(() => {
    const characterSet = gameMode === 'elf-find' ? ELF_CHARACTERS : HORROR_CHARACTERS
    const newCharacters = characterSet.map(char => ({
      ...char,
      x: Math.random() * 700 + 50,
      y: Math.random() * 500 + 50,
      found: false
    }))
    setCharacters(newCharacters)
  }, [gameMode])

  // Helper function to check if player is on a platform
  const isPlayerOnPlatform = useCallback((playerX: number, playerY: number, platform: Platform) => {
    const playerRight = playerX + PLAYER_HITBOX_SIZE
    const playerLeft = playerX - PLAYER_HITBOX_SIZE
    const playerBottom = playerY + PLAYER_HITBOX_SIZE
    const playerTop = playerY - PLAYER_HITBOX_SIZE
    
    const platformRight = platform.x + platform.width
    const platformLeft = platform.x
    const platformBottom = platform.y + platform.height
    const platformTop = platform.y
    
    return (
      playerRight > platformLeft &&
      playerLeft < platformRight &&
      playerBottom > platformTop &&
      playerTop < platformBottom
    )
  }, [])

  // Start game
  const startGame = () => {
    if (playerName.trim()) {
      if (gameMode === 'secret-santa') {
        // For Secret Santa mode, just show the picker
        setGameStarted(true)
        setSecretSantaAssignment(null)
        setAvailableNames([])
        setPickedNames([])
        return
      }
      
      setGameStarted(true)
      setScore(0)
      setShowJumpscare(false)
      const duration = gameMode === 'elf-find' ? ELF_GAME_DURATION_SECONDS : 
                       gameMode === 'obby' ? OBBY_GAME_DURATION_SECONDS : 
                       GAME_DURATION_SECONDS
      setTimeLeft(duration)
      setGameOver(false)
      
      if (gameMode === 'obby') {
        generateObby()
        setPlayerX(100)
        setPlayerY(500)
      } else {
        generateHouse()
        placeCharacters()
        setPlayerX(50)
        setPlayerY(50)
      }
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
          // Award points - Santa gives 10 billion, others give 100
          const points = char.points || DEFAULT_CHARACTER_POINTS
          setScore(prev => prev + points)
        }
      }
    })

    // Check if all characters found
    if (characters.length > 0 && characters.every(c => c.found)) {
      setGameOver(true)
    }
  }, [playerX, playerY, characters, gameStarted, gameOver])

  // Obby mode: Check platform collision and finish line
  useEffect(() => {
    if (!gameStarted || gameOver || gameMode !== 'obby' || showJumpscare) return

    // Check if player is on a platform
    const onPlatform = platforms.some(platform => isPlayerOnPlatform(playerX, playerY, platform))

    // Check if player reached finish platform
    const finishPlatform = platforms.find(p => p.isFinish)
    if (finishPlatform && isPlayerOnPlatform(playerX, playerY, finishPlatform)) {
      setScore(prev => prev + OBBY_COMPLETION_POINTS)
      setGameOver(true)
      return
    }

    // If not on any platform, player falls - show jumpscare!
    if (!onPlatform && platforms.length > 0) {
      setShowJumpscare(true)
    }
  }, [playerX, playerY, platforms, gameStarted, gameOver, gameMode, showJumpscare, isPlayerOnPlatform])

  // Handle jumpscare timeout
  useEffect(() => {
    if (showJumpscare && gameMode === 'obby' && !gameOver) {
      jumpscareTimeoutRef.current = setTimeout(() => {
        setGameOver(true)
      }, JUMPSCARE_DURATION_MS)
      
      return () => {
        if (jumpscareTimeoutRef.current) {
          clearTimeout(jumpscareTimeoutRef.current)
        }
      }
    }
  }, [showJumpscare, gameMode, gameOver])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (jumpscareTimeoutRef.current) {
        clearTimeout(jumpscareTimeoutRef.current)
      }
    }
  }, [])

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
      case 'elf-find':
        return {
          bg: 'bg-gradient-to-br from-green-600 via-red-600 to-green-700',
          text: 'text-white',
          player: '🎄',
          scary: 'opacity-100 animate-bounce'
        }
      case 'obby':
        return {
          bg: 'bg-gradient-to-br from-purple-900 via-black to-red-900',
          text: 'text-purple-100',
          player: '🏃',
          scary: 'opacity-100'
        }
      case 'secret-santa':
        return {
          bg: 'bg-gradient-to-br from-red-700 via-green-700 to-red-800',
          text: 'text-white',
          player: '🎅',
          scary: 'opacity-100'
        }
    }
  }

  const style = getModeStyle()

  if (!gameStarted) {
    const isElfMode = gameMode === 'elf-find'
    const isSecretSanta = gameMode === 'secret-santa'
    
    // Determine styling based on mode
    const menuBg = isSecretSanta 
      ? 'bg-gradient-to-br from-red-700 via-green-700 to-red-800'
      : isElfMode 
        ? 'bg-gradient-to-br from-green-800 via-red-900 to-green-900' 
        : 'bg-gradient-to-br from-purple-900 via-black to-red-900'
    
    const borderColor = isSecretSanta 
      ? 'border-red-500' 
      : isElfMode 
        ? 'border-green-500' 
        : 'border-red-600'
    
    const titleColor = isSecretSanta 
      ? 'text-red-400' 
      : isElfMode 
        ? 'text-green-400' 
        : 'text-red-500'
    
    const titleShadow = isSecretSanta 
      ? '0 0 10px #dc2626' 
      : isElfMode 
        ? '0 0 10px #22c55e' 
        : '0 0 10px #ff0000'
    
    const titleText = isSecretSanta 
      ? '🎁 Secret Santa 🎁' 
      : isElfMode 
        ? '🎄 Elf Finder 🎅' 
        : '👻 Horror Finder 👻'
    
    return (
      <div className={`min-h-screen ${menuBg} flex items-center justify-center p-4`}>
        <div className={`bg-black bg-opacity-80 p-8 rounded-2xl shadow-2xl max-w-md w-full border-2 ${borderColor}`}>
          <h1 className={`text-5xl font-bold text-center mb-2 ${titleColor}`} style={{ textShadow: titleShadow }}>
            {titleText}
          </h1>
          <p className="text-center text-gray-300 mb-6 text-sm">
            {isSecretSanta ? 'Pick a name from the bucket to find out who you\'ll give a gift to!' : isElfMode ? 'Find all the elves and Santa before time runs out!' : 'Find all the horror characters before time runs out!'}
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
                onClick={() => setGameMode('secret-santa')}
                className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${
                  gameMode === 'secret-santa'
                    ? 'bg-red-600 text-white border-2 border-white'
                    : 'bg-red-700 text-gray-300 border-2 border-red-600 hover:bg-red-600'
                }`}
              >
                🎁 Secret Santa Picker (NEW!)
              </button>
              <button
                onClick={() => setGameMode('obby')}
                className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${
                  gameMode === 'obby'
                    ? 'bg-purple-600 text-white border-2 border-white'
                    : 'bg-purple-700 text-gray-300 border-2 border-purple-600 hover:bg-purple-600'
                }`}
              >
                😱 Jumpscare Obby (NEW!)
              </button>
              <button
                onClick={() => setGameMode('elf-find')}
                className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${
                  gameMode === 'elf-find'
                    ? 'bg-green-600 text-white border-2 border-white'
                    : 'bg-green-700 text-gray-300 border-2 border-green-600 hover:bg-green-600'
                }`}
              >
                🎅 Elf Find Mode (59 seconds!)
              </button>
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
            {gameMode === 'secret-santa' ? (
              <>
                <p className="mb-2">🎁 Pick a name from the bucket!</p>
                <p>Participants: Bennett, Hendrix, Isaac, Vince, Daniel, Addie, Owen, Evie, Simon, Hannah, Marina</p>
              </>
            ) : (
              <>
                <p className="mb-2">🎮 Use Arrow Keys or WASD to move</p>
                {gameMode === 'obby' ? (
                  <p>Jump across platforms to reach the finish! Fall off and get a jumpscare! 😱</p>
                ) : (
                  <>
                    <p>Find: {(gameMode === 'elf-find' ? ELF_CHARACTERS : HORROR_CHARACTERS).map(c => c.emoji + ' ' + c.name).join(', ')}</p>
                    {gameMode === 'elf-find' && (
                      <p className="mt-2 text-yellow-400 font-semibold">⭐ Finding Santa gives 10 billion points! ⭐</p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Secret Santa mode screen
  if (gameMode === 'secret-santa') {
    return (
      <div className={`min-h-screen ${style.bg} flex items-center justify-center p-4`}>
        <div className="max-w-2xl w-full">
          <div className="bg-black bg-opacity-80 p-8 rounded-2xl shadow-2xl border-2 border-red-500">
            <h1 className="text-5xl font-bold text-center mb-4 text-red-400" style={{ textShadow: '0 0 10px #dc2626' }}>
              🎁 Secret Santa Picker 🎁
            </h1>
            <h2 className="text-2xl text-center mb-8 text-white">
              Hello, {playerName}!
            </h2>

            {secretSantaAssignment ? (
              <div className="text-center">
                <div className="bg-green-900 bg-opacity-50 p-8 rounded-xl border-2 border-green-500 mb-6">
                  <p className="text-xl text-white mb-4">🎅 You picked:</p>
                  <p className="text-6xl font-bold text-yellow-400 mb-4 animate-bounce">
                    {secretSantaAssignment}
                  </p>
                  <p className="text-2xl text-white">
                    You'll be giving a gift to {secretSantaAssignment}! 🎁
                  </p>
                </div>
                
                <div className="mb-6 text-gray-300">
                  <p className="mb-2">Names picked: {pickedNames.length} / {SECRET_SANTA_PARTICIPANTS.length}</p>
                  <p className="text-sm">Remaining in bucket: {availableNames.length}</p>
                </div>

                <div className="flex gap-4 justify-center">
                  {availableNames.length > 0 && (
                    <button
                      onClick={() => setSecretSantaAssignment(null)}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors"
                    >
                      Let someone else pick
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setGameStarted(false)
                      resetSecretSanta()
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors"
                  >
                    Back to Menu
                  </button>
                  {availableNames.length === 0 && (
                    <button
                      onClick={resetSecretSanta}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors"
                    >
                      🔄 Reset Bucket
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-red-900 bg-opacity-50 p-12 rounded-xl border-2 border-red-600 mb-8">
                  <div className="text-8xl mb-6 animate-bounce">🎄</div>
                  <p className="text-3xl text-white mb-6">
                    Pick from the bucket!
                  </p>
                  <div className="text-lg text-gray-300 mb-4">
                    <p>Names in bucket: {availableNames.length > 0 ? availableNames.length : SECRET_SANTA_PARTICIPANTS.length}</p>
                    {pickedNames.length > 0 && (
                      <p className="mt-2">Already picked: {pickedNames.length}</p>
                    )}
                  </div>
                  <button
                    onClick={pickSecretSanta}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-4 px-12 rounded-lg text-2xl transition-all transform hover:scale-105 shadow-lg"
                  >
                    🎁 Pick a Name!
                  </button>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => {
                      setGameStarted(false)
                      resetSecretSanta()
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                  >
                    Back to Menu
                  </button>
                </div>

                <div className="mt-8 text-center text-gray-400">
                  <p className="text-sm mb-2">Participants:</p>
                  <p className="text-xs">
                    {SECRET_SANTA_PARTICIPANTS.join(', ')}
                  </p>
                </div>
              </div>
            )}
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
          {gameMode !== 'obby' && (
            <div className="flex gap-2">
              {(gameMode === 'elf-find' ? ELF_CHARACTERS : HORROR_CHARACTERS).map((char) => {
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
          )}
          {gameMode === 'obby' && (
            <div className={`text-xl font-semibold ${style.text}`}>
              🏁 Reach the finish to win 100 points!
            </div>
          )}
        </div>

        {/* Game Area */}
        <div className="bg-black bg-opacity-50 rounded-lg p-4 relative overflow-hidden" style={{ height: '600px' }}>
          {/* Obby platforms */}
          {gameMode === 'obby' && platforms.map((platform, index) => (
            <div
              key={index}
              className={`absolute rounded ${platform.isFinish ? 'bg-green-600 border-4 border-yellow-400' : 'bg-purple-700 border-2 border-purple-500'}`}
              style={{
                left: `${platform.x}px`,
                top: `${platform.y}px`,
                width: `${platform.width}px`,
                height: `${platform.height}px`,
              }}
            >
              {platform.isFinish && (
                <div className="flex items-center justify-center h-full text-white font-bold text-lg">
                  🏁 FINISH
                </div>
              )}
            </div>
          ))}

          {/* House rooms (non-obby modes) */}
          {gameMode !== 'obby' && rooms.map((room, index) => (
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

          {/* Horror characters (non-obby modes) */}
          {gameMode !== 'obby' && characters.map((char) => (
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

          {/* Jumpscare Overlay */}
          {showJumpscare && (
            <div className="absolute inset-0 bg-red-600 flex items-center justify-center rounded-lg animate-pulse z-50">
              <div className="text-center">
                <div className="text-9xl animate-bounce">😱</div>
                <h2 className="text-6xl font-bold text-white mt-4" style={{ textShadow: '0 0 20px #000' }}>
                  AAAHHH!!!
                </h2>
                <p className="text-3xl text-white mt-2">You fell off!</p>
              </div>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameOver && !showJumpscare && (
            <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center rounded-lg">
              <div className="text-center">
                {gameMode === 'obby' ? (
                  <>
                    <h2 className="text-5xl font-bold mb-4 text-green-500">
                      {score >= OBBY_COMPLETION_POINTS ? '🎉 You Made It! 🎉' : '💀 You Failed! 💀'}
                    </h2>
                    <p className="text-2xl text-white mb-2">
                      Final Score: {score}
                    </p>
                    <p className="text-xl text-gray-300 mb-6">
                      {score >= OBBY_COMPLETION_POINTS 
                        ? 'You survived the jumpscare obby and earned 100 points!' 
                        : 'You fell off the platforms. Try again!'}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-5xl font-bold mb-4 text-red-500">
                      {characters.every(c => c.found) ? '🎉 You Won! 🎉' : '⏰ Time\'s Up! ⏰'}
                    </h2>
                    <p className="text-2xl text-white mb-2">
                      Final Score: {score}
                    </p>
                    <p className="text-xl text-gray-300 mb-6">
                      Found: {characters.filter(c => c.found).length} / {characters.length} characters
                    </p>
                  </>
                )}
                <button
                  onClick={() => {
                    setGameStarted(false)
                    setPlayerX(50)
                    setPlayerY(50)
                    setShowJumpscare(false)
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
            🎮 Use Arrow Keys or WASD to move • {gameMode === 'obby' 
              ? 'Navigate the platforms without falling!' 
              : `Find all ${gameMode === 'elf-find' ? 'elves and Santa' : 'horror characters'} to win!`}
          </p>
        </div>
      </div>
    </div>
  )
}
