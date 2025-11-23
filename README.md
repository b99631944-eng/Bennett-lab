# WebAR Platform - Core Engine Architecture 🎯

A scalable WebAR and 3D gaming platform for iOS Safari built with TypeScript, Three.js, and a custom Entity Component System (ECS).
# Horror & Elf Finder Game 👻🎄

A thrilling browser-based game collection featuring multiple game modes including horror character finding, elf hunting, a challenging jumpscare obstacle course, and a Secret Santa picker!

## 🌟 Features

### Core Engine
- **Singleton Engine Architecture**: Centralized management of Three.js renderer, scene, and camera
- **60 FPS Game Loop**: Precision timing with frame rate limiting and delta time calculation
- **Entity Component System (ECS)**: Data-oriented architecture for scalable game objects
- **Debug UI**: Real-time debugging with Tweakpane integration

- **Six Game Modes**:
  - 🎁 **Secret Santa Picker (NEW!)**: Organize your Secret Santa gift exchange! Pick names from a virtual bucket with 11 participants. Perfect for holiday parties!
  - 😱 **Jumpscare Obby**: Navigate across floating platforms in a spooky obstacle course! Fall off and get a terrifying jumpscare! Complete the course to earn 100 points. 2-minute time limit.
### iOS AR Support
- **Camera Permission Handling**: State machine for iOS permission flow
- **Camera Feed Integration**: Direct video stream to Three.js VideoTexture
- **iOS-Specific Optimizations**: Handles `playsinline`, retina displays, and touch events
- **AR Scene Stage**: Pre-configured lighting and camera setup for AR experiences
- **Five Game Modes**:
  - 😱 **Jumpscare Obby (NEW!)**: Navigate across floating platforms in a spooky obstacle course! Fall off and get a terrifying jumpscare! Complete the course to earn 100 points. 2-minute time limit.
  - 🎅 **Elf Find Mode**: Festive Christmas theme where you find 3 elves and Santa in 59 seconds! Santa is worth 10 billion points!
  - 🏚️ **Realistic Mode**: Dark, atmospheric visuals for a serious horror experience
  - 🎨 **Animated Mode**: Colorful, friendly appearance for a lighter experience
  - 💀 **Normal Mode (Scary)**: Red and black theme with pulsing effects - the scariest mode!

- **Secret Santa Features**:
  - 🎁 Interactive virtual bucket with 11 participants
  - 👥 Participants: Bennett, Hendrix, Isaac, Vince, Daniel, Addie, Owen, Evie, Simon, Hannah, Marina
  - 🎲 Randomized name shuffling for fair selection
  - 📊 Progress tracking (names picked vs remaining)
  - 🔄 Multi-user support - pass around to let everyone pick
  - ♻️ Reset bucket option when all names are drawn
  
- **Random Level Generation**: 
  - House modes generate unique layouts with 6-10 randomly placed rooms
  - Obby mode creates challenging platform courses with 8-10 platforms
- **Multiple Character Sets**: 
  - **Elf Mode**: Find Elf Helper (🧝), Elf Worker (🧝‍♀️), Elf Builder (🧝‍♂️), and Santa Claus (🎅)
  - **Horror Mode**: Find Pennywise (🤡), Michael Myers (🔪), and Freddy Krueger (😈)
- **Player Controls**: Smooth movement using Arrow Keys or WASD (for game modes)
- **Scoring System**: 
  - Earn 100 points for each regular character
  - Santa awards a massive 10,000,000,000 points!
  - Complete the obby course for 100 points!
- **Time Challenge**: 
  - Jumpscare Obby: 2-minute countdown
  - Elf Find Mode: 59-second countdown
  - Horror Modes: 3-minute countdown
  - Secret Santa: No time limit - take your time!

### Asset Management
- **Async Resource Loader**: GLTF models, textures, audio with progress tracking
- **Event-Driven Loading**: Observable pattern for load events
- **Loading Screen**: Smooth animated progress indicator

### Input System
- **Touch Gestures**: Tap, swipe, pinch abstractions
- **Device Orientation**: Gyroscope/accelerometer integration
- **Raycasting**: 3D object picking from touch/mouse coordinates
- **Desktop Testing**: Mouse fallback for development
1. Enter your player name
2. Select your preferred game mode (Secret Santa Picker, Jumpscare Obby, Elf Find, Realistic, Animated, or Normal/Scary)
3. Click "Start Game"
4. **For Secret Santa Mode**: Click "Pick a Name!" to randomly draw from the bucket. Share the results with participants, then click "Let someone else pick" for the next person!
5. **For House Modes**: Use **Arrow Keys** or **WASD** to move your player around the house and find all characters
6. **For Obby Mode**: Navigate across platforms without falling! Reach the green finish platform to win!
7. Win by completing your objective before time runs out! (Not applicable to Secret Santa mode)

### Scene Management
- **Stage System**: Modular scene switching (Menu, Game, AR)
- **Lifecycle Hooks**: `onInit`, `onUpdate`, `onDestroy` for each stage
- **Scene Isolation**: Clean resource management per stage

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run lint
```

### Development

The dev server runs on `http://localhost:3000/`. On first load:

1. You'll see a **"Tap to Start"** button
2. Click/tap to trigger camera permission request
3. Grant camera access (required for AR features)
4. The AR stage loads with a demo rotating cube

## 📁 Project Structure

```
src/
├── core/
│   ├── Engine.ts              # Singleton engine with Three.js setup
│   ├── Time.ts                # Game loop and timing
│   ├── SceneManager.ts        # Stage/scene switching
│   ├── ecs/
│   │   ├── Entity.ts          # Entity ID containers
│   │   ├── Component.ts       # Abstract component class
│   │   ├── System.ts          # Abstract system class
│   │   └── World.ts           # ECS world manager
│   ├── device/
│   │   ├── PermissionHandler.ts  # iOS permission flow
│   │   └── CameraFeed.ts         # Camera stream management
│   ├── input/
│   │   └── InputManager.ts    # Touch, gyro, raycasting
│   └── loaders/
│       └── Resources.ts       # Asset loading system
├── components/
│   ├── PositionComponent.ts   # 3D position data
│   ├── MeshComponent.ts       # Three.js mesh reference
│   └── VelocityComponent.ts   # Movement velocity
├── systems/
│   └── RenderSystem.ts        # Syncs meshes with positions
├── stages/
│   └── ARStage.ts             # AR scene implementation
├── utils/
│   └── Observer.ts            # Event emitter
├── styles/
│   └── main.css              # Base styles
└── main.ts                    # Application entry point
```

## 🎮 Architecture Overview

### Entity Component System (ECS)

The engine uses a data-oriented ECS architecture:

- **Entities**: Lightweight containers with unique IDs
- **Components**: Pure data (Position, Mesh, Velocity)
- **Systems**: Logic that processes entities with specific components

Example:

```typescript
// Create entity
const entity = new Entity('MyCube');
world.addEntity(entity);

// Add components
const position = new PositionComponent(entity.id, 0, 0, -1);
const mesh = new MeshComponent(entity.id, threeMesh);
world.addComponent(entity.id, position);
world.addComponent(entity.id, mesh);

// Query entities
const renderables = world.query(PositionComponent, MeshComponent);
```

### Stage Lifecycle

Each stage implements three lifecycle methods:

```typescript
interface Stage {
  onInit(engine: Engine): void;      // Setup
  onUpdate(delta: number, elapsed: number, engine: Engine): void;  // Per-frame
  onDestroy(engine: Engine): void;   // Cleanup
}
```

### Input Events

The InputManager emits observable events:

```typescript
inputManager.on('tap', (data) => {
  console.log('Tapped at:', data.x, data.y);
});

inputManager.on('swipe', (data) => {
  console.log('Swiped:', data.direction);
});

inputManager.on('pinch', (data) => {
  console.log('Pinch scale:', data.scale);
});
```

## 🔧 Configuration

### Engine Setup

```typescript
const engine = Engine.getInstance({
  container: document.getElementById('canvas-container'),
  enableRetina: true,    // High-DPI rendering
  antialias: true,       // Smooth edges
  debug: true,           // Show Tweakpane UI
  targetFPS: 60,         // Frame rate cap
});
```

### Camera Feed

```typescript
const cameraFeed = new CameraFeed({
  facingMode: 'environment',  // Rear camera for AR
  width: 1920,
  height: 1080,
});

await cameraFeed.start();
const texture = cameraFeed.getTexture();  // Three.js VideoTexture
```

## 📱 iOS Compatibility

The platform is optimized for iOS Safari:

- **Camera Permissions**: Proper state machine with user gesture requirement
- **Video Playback**: Automatic `playsinline` attributes
- **Touch Events**: Gesture recognition with mobile-first design
- **Retina Support**: Auto-detection and pixel ratio adjustment
- **Device Orientation**: Gyroscope integration with iOS 13+ permissions

## 🎨 Extending the Engine

### Creating a New Component

```typescript
import { Component } from '@/core/ecs/Component';
### Elf Find Mode Menu
![Elf Find Menu](https://github.com/user-attachments/assets/9f52a3a7-0b8f-4d25-8563-a156da4ce04b)

### Elf Find Mode Gameplay
![Elf Find Gameplay](https://github.com/user-attachments/assets/88898c5b-f78c-4281-8f45-56ea7c579310)

### Main Menu
![Menu](https://github.com/user-attachments/assets/e195d813-ee0d-41ae-9877-6a85697798f0)

export class HealthComponent extends Component {
  public health: number;
  public maxHealth: number;

  constructor(entityId: number, health = 100) {
    super(entityId);
    this.health = health;
    this.maxHealth = health;
  }
}
```

### Creating a New System

```typescript
import { System } from '@/core/ecs/System';

export class HealthSystem extends System {
  public update(delta: number, elapsed: number): void {
    const entities = this.world.query(HealthComponent);
    
    entities.forEach((entityId) => {
      const health = this.world.getComponent(entityId, HealthComponent);
      // Update health logic
    });
  }
}
```

### Creating a New Stage

```typescript
import { Stage } from '@/core/SceneManager';
import { Engine } from '@/core/Engine';

export class MenuStage implements Stage {
  public readonly name = 'MenuStage';

  public onInit(engine: Engine): void {
    // Setup menu
  }

  public onUpdate(delta: number, elapsed: number, engine: Engine): void {
    // Update menu
  }

  public onDestroy(engine: Engine): void {
    // Cleanup menu
  }
}
```

## 🔐 Security

- No credentials stored in code
- Camera access requires explicit user permission
- No data collection or external API calls
- All assets loaded from local/trusted sources

## 📦 Tech Stack

- **TypeScript 5.9** - Type-safe development
- **Vite 5** - Fast build tool and dev server
- **Three.js 0.160** - 3D rendering engine
- **Cannon-es 0.20** - Physics engine (integrated)
- **Tweakpane 4** - Debug UI

## 🐛 Debugging

The debug UI (Tweakpane) shows:
- Real-time FPS
- Entity count
- Active systems count
- Camera position
- Renderer settings

Toggle debug mode in Engine config:

```typescript
Engine.getInstance({ debug: false });  // Disable debug UI
```

## 📝 License

ISC

## 🙏 Acknowledgments

Built following modern ECS patterns and WebXR best practices for iOS Safari compatibility.

---

**Note**: This is a core engine architecture. Game logic, AI, and specific AR experiences should be built on top of this foundation using the provided systems.

