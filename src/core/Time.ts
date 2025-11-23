/**
 * Time Management System
 * 
 * Handles requestAnimationFrame loop, delta time calculation, and frame rate limiting.
 * Provides consistent timing information for the entire application.
 */

export class Time {
  /** Time when the app started (milliseconds) */
  private startTime: number;

  /** Time of the last frame (milliseconds) */
  private lastFrameTime: number;

  /** Time since last frame (seconds) */
  private _delta: number;

  /** Total elapsed time since start (seconds) */
  private _elapsed: number;

  /** Current frame number */
  private _frameCount: number;

  /** Target frames per second (0 = unlimited) */
  private _targetFPS: number;

  /** Minimum time between frames (milliseconds) */
  private minFrameTime: number;

  /** Current frames per second (calculated) */
  private _fps: number;

  /** Time accumulator for FPS calculation */
  private fpsAccumulator: number;

  /** Frame count for FPS calculation */
  private fpsFrameCount: number;

  /** Animation frame request ID */
  private rafId: number | null;

  /** Update callback */
  private updateCallback: ((delta: number, elapsed: number) => void) | null;

  /** Whether the loop is currently running */
  private _isRunning: boolean;

  constructor(targetFPS = 60) {
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this._delta = 0;
    this._elapsed = 0;
    this._frameCount = 0;
    this._targetFPS = targetFPS;
    this.minFrameTime = targetFPS > 0 ? 1000 / targetFPS : 0;
    this._fps = 0;
    this.fpsAccumulator = 0;
    this.fpsFrameCount = 0;
    this.rafId = null;
    this.updateCallback = null;
    this._isRunning = false;
  }

  /**
   * Starts the game loop
   * @param callback - Function to call each frame with (delta, elapsed)
   */
  public start(callback: (delta: number, elapsed: number) => void): void {
    if (this._isRunning) {
      console.warn('Time loop is already running');
      return;
    }

    this.updateCallback = callback;
    this._isRunning = true;
    this.lastFrameTime = performance.now();
    this.tick(this.lastFrameTime);
  }

  /**
   * Stops the game loop
   */
  public stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this._isRunning = false;
  }

  /**
   * Main loop tick function
   * @param currentTime - Current timestamp from requestAnimationFrame
   */
  private tick = (currentTime: number): void => {
    if (!this._isRunning) return;

    // Calculate time since last frame
    const deltaMs = currentTime - this.lastFrameTime;

    // Frame rate limiting
    if (this._targetFPS > 0 && deltaMs < this.minFrameTime) {
      this.rafId = requestAnimationFrame(this.tick);
      return;
    }

    // Update delta and elapsed time
    this._delta = deltaMs / 1000; // Convert to seconds
    this._elapsed = (currentTime - this.startTime) / 1000;
    this._frameCount++;

    // Calculate FPS
    this.fpsAccumulator += deltaMs;
    this.fpsFrameCount++;

    if (this.fpsAccumulator >= 1000) {
      this._fps = Math.round((this.fpsFrameCount * 1000) / this.fpsAccumulator);
      this.fpsAccumulator = 0;
      this.fpsFrameCount = 0;
    }

    // Call update callback
    if (this.updateCallback) {
      this.updateCallback(this._delta, this._elapsed);
    }

    this.lastFrameTime = currentTime;
    this.rafId = requestAnimationFrame(this.tick);
  };

  /**
   * Gets delta time (time since last frame in seconds)
   */
  public get delta(): number {
    return this._delta;
  }

  /**
   * Gets elapsed time (total time since start in seconds)
   */
  public get elapsed(): number {
    return this._elapsed;
  }

  /**
   * Gets current frame count
   */
  public get frameCount(): number {
    return this._frameCount;
  }

  /**
   * Gets current FPS
   */
  public get fps(): number {
    return this._fps;
  }

  /**
   * Gets target FPS
   */
  public get targetFPS(): number {
    return this._targetFPS;
  }

  /**
   * Sets target FPS
   * @param fps - Target frames per second (0 = unlimited)
   */
  public set targetFPS(fps: number) {
    this._targetFPS = fps;
    this.minFrameTime = fps > 0 ? 1000 / fps : 0;
  }

  /**
   * Checks if the loop is running
   */
  public get isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Resets the timer
   */
  public reset(): void {
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this._delta = 0;
    this._elapsed = 0;
    this._frameCount = 0;
    this._fps = 0;
    this.fpsAccumulator = 0;
    this.fpsFrameCount = 0;
  }
}
