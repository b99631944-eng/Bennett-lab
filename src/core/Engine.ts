/**
 * Core Engine Singleton
 * 
 * Central coordinator for the entire WebAR platform.
 * Manages Three.js renderer, scene, camera, and the game loop.
 */

import * as THREE from 'three';
import { Pane } from 'tweakpane';
import { World } from './ecs/World';
import { Time } from './Time';

export interface EngineConfig {
  /** Container element for the canvas */
  container: HTMLElement;
  
  /** Enable retina/high-DPI rendering */
  enableRetina?: boolean;
  
  /** Enable anti-aliasing */
  antialias?: boolean;
  
  /** Enable debug UI */
  debug?: boolean;
  
  /** Target frames per second */
  targetFPS?: number;
}

export class Engine {
  private static instance: Engine | null = null;

  /** Three.js renderer */
  public renderer: THREE.WebGLRenderer;

  /** Three.js scene */
  public scene: THREE.Scene;

  /** Three.js camera */
  public camera: THREE.PerspectiveCamera;

  /** ECS World */
  public world: World;

  /** Time manager */
  public time: Time;

  /** Debug UI pane */
  public debugPane: Pane | null;

  /** Container element */
  private container: HTMLElement;

  /** Configuration */
  private config: Required<EngineConfig>;

  /** Whether the engine is initialized */
  private initialized: boolean;

  private constructor(config: EngineConfig) {
    this.config = {
      container: config.container,
      enableRetina: config.enableRetina ?? true,
      antialias: config.antialias ?? true,
      debug: config.debug ?? true,
      targetFPS: config.targetFPS ?? 60,
    };

    this.container = this.config.container;
    this.initialized = false;

    // Initialize Three.js
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.config.antialias,
      alpha: true,
      powerPreference: 'high-performance',
    });

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Initialize ECS
    this.world = new World();

    // Initialize Time
    this.time = new Time(this.config.targetFPS);

    // Initialize Debug UI
    this.debugPane = null;
  }

  /**
   * Gets or creates the singleton instance
   * @param config - Engine configuration (only used on first call)
   */
  public static getInstance(config?: EngineConfig): Engine {
    if (!Engine.instance && config) {
      Engine.instance = new Engine(config);
    }

    if (!Engine.instance) {
      throw new Error('Engine must be initialized with config first');
    }

    return Engine.instance;
  }

  /**
   * Destroys the singleton instance
   */
  public static destroy(): void {
    if (Engine.instance) {
      Engine.instance.shutdown();
      Engine.instance = null;
    }
  }

  /**
   * Initializes the engine
   */
  public init(): void {
    if (this.initialized) {
      console.warn('Engine already initialized');
      return;
    }

    // Setup renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    if (this.config.enableRetina) {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;

    // Append canvas to container
    this.container.appendChild(this.renderer.domElement);

    // Setup camera
    this.camera.position.set(0, 1.6, 3);
    this.camera.lookAt(0, 0, 0);

    // Setup debug UI
    if (this.config.debug) {
      this.setupDebugUI();
    }

    // Setup resize handler
    this.setupResizeHandler();

    this.initialized = true;
    console.log('🚀 Engine initialized');
  }

  /**
   * Starts the engine loop
   */
  public start(): void {
    if (!this.initialized) {
      throw new Error('Engine must be initialized before starting');
    }

    this.time.start((delta, elapsed) => {
      this.update(delta, elapsed);
      this.render();
    });

    console.log('▶️ Engine started');
  }

  /**
   * Stops the engine loop
   */
  public stop(): void {
    this.time.stop();
    console.log('⏸️ Engine stopped');
  }

  /**
   * Updates the engine state
   * @param delta - Time since last frame in seconds
   * @param elapsed - Total elapsed time in seconds
   */
  private update(delta: number, elapsed: number): void {
    // Update ECS systems
    this.world.update(delta, elapsed);
  }

  /**
   * Renders the scene
   */
  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Sets up the debug UI
   */
  private setupDebugUI(): void {
    this.debugPane = new Pane({ title: 'Debug' });

    // Create stats object that we'll update
    const stats = {
      fps: 0,
      entities: 0,
      systems: 0,
      camX: 0,
      camY: 0,
      camZ: 0,
    };

    // Add bindings using type assertion to work around type issues
    const pane = this.debugPane as any;
    pane.addBinding(stats, 'fps', { readonly: true, label: 'FPS' });
    pane.addBinding(stats, 'entities', { readonly: true, label: 'Entities' });
    pane.addBinding(stats, 'systems', { readonly: true, label: 'Systems' });
    pane.addBinding(stats, 'camX', { readonly: true, label: 'Camera X' });
    pane.addBinding(stats, 'camY', { readonly: true, label: 'Camera Y' });
    pane.addBinding(stats, 'camZ', { readonly: true, label: 'Camera Z' });
  }

  /**
   * Sets up window resize handler
   */
  private setupResizeHandler(): void {
    const handleResize = (): void => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
  }

  /**
   * Shuts down the engine
   */
  private shutdown(): void {
    this.stop();
    
    if (this.debugPane) {
      this.debugPane.dispose();
      this.debugPane = null;
    }

    this.world.clear();
    
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    
    this.renderer.dispose();
    
    this.initialized = false;
    console.log('🛑 Engine shutdown');
  }

  /**
   * Gets the canvas element
   */
  public getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  /**
   * Checks if the engine is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Checks if the engine is running
   */
  public isRunning(): boolean {
    return this.time.isRunning;
  }
}
