/**
 * Main Entry Point
 * 
 * Initializes the WebAR platform and starts the application.
 */

import { Engine } from '@/core/Engine';
import { SceneManager } from '@/core/SceneManager';
import { PermissionHandler } from '@/core/device/PermissionHandler';
import { InputManager } from '@/core/input/InputManager';
import { RenderSystem } from '@/systems/RenderSystem';
import { ARStage } from '@/stages/ARStage';
import '@/styles/main.css';

/**
 * Application class
 */
class App {
  private engine: Engine | null;
  private sceneManager: SceneManager | null;
  private permissionHandler: PermissionHandler;
  private inputManager: InputManager | null;

  constructor() {
    this.engine = null;
    this.sceneManager = null;
    this.inputManager = null;
    this.permissionHandler = new PermissionHandler({
      camera: true,
      audio: false,
      onStateChange: (state) => {
        console.log(`Permission state: ${state}`);
      },
    });
  }

  /**
   * Initializes and starts the application
   */
  public async init(): Promise<void> {
    console.log('🚀 Starting WebAR Platform...');

    // Show permission UI and wait for user interaction
    await this.permissionHandler.showPermissionUI();

    // Request permissions (must be called from user gesture)
    const granted = await this.permissionHandler.requestPermissions();

    if (!granted) {
      console.error('Camera permission denied. AR features will be limited.');
      // Continue anyway with limited functionality
    }

    // Get container element
    const container = document.getElementById('canvas-container');
    if (!container) {
      throw new Error('Canvas container not found');
    }

    // Initialize engine
    this.engine = Engine.getInstance({
      container,
      enableRetina: true,
      antialias: true,
      debug: true,
      targetFPS: 60,
    });

    this.engine.init();

    // Setup input manager
    this.inputManager = new InputManager(
      this.engine.getCanvas(),
      this.engine.camera
    );

    this.setupInputHandlers();

    // Add render system
    const renderSystem = new RenderSystem(this.engine);
    this.engine.world.addSystem(renderSystem);

    // Setup scene manager
    this.sceneManager = new SceneManager(this.engine);

    // Register stages
    const arStage = new ARStage();
    this.sceneManager.registerStage('ar', arStage);

    // Start with AR stage
    this.sceneManager.switchTo('ar');

    // Start engine
    this.engine.start();

    console.log('✅ WebAR Platform ready!');
  }

  /**
   * Sets up input event handlers
   */
  private setupInputHandlers(): void {
    if (!this.inputManager) return;

    // Tap handler
    this.inputManager.on('tap', (data: { x: number; y: number }) => {
      console.log('Tap detected at:', data);
    });

    // Swipe handler
    this.inputManager.on('swipe', (data: any) => {
      console.log('Swipe detected:', data.direction);
    });

    // Pinch handler
    this.inputManager.on('pinch', (data: any) => {
      console.log('Pinch scale:', data.scale);
    });

    // Try to enable device orientation
    this.inputManager.enableDeviceOrientation().then((enabled) => {
      if (enabled) {
        this.inputManager?.on('orientation', () => {
          // Device orientation data available
          // Can be used to control camera or detect device tilt
        });
      }
    });
  }

  /**
   * Cleanup
   */
  public dispose(): void {
    if (this.inputManager) {
      this.inputManager.dispose();
    }

    if (this.sceneManager) {
      this.sceneManager.dispose();
    }

    if (this.engine) {
      Engine.destroy();
    }
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init().catch((error) => {
      console.error('Failed to initialize app:', error);
    });
  });
} else {
  const app = new App();
  app.init().catch((error) => {
    console.error('Failed to initialize app:', error);
  });
}
