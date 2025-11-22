/**
 * Scene Manager
 * 
 * Manages different stages/scenes in the application.
 * Handles transitions between Menu, Game, and AR modes.
 */

import { Engine } from './Engine';

export interface Stage {
  /** Stage name for debugging */
  name: string;

  /** Called when stage is entered */
  onInit(engine: Engine): void;

  /** Called every frame while stage is active */
  onUpdate(delta: number, elapsed: number, engine: Engine): void;

  /** Called when stage is exited */
  onDestroy(engine: Engine): void;
}

export class SceneManager {
  private engine: Engine;
  private currentStage: Stage | null;
  private stages: Map<string, Stage>;

  constructor(engine: Engine) {
    this.engine = engine;
    this.currentStage = null;
    this.stages = new Map();
  }

  /**
   * Registers a stage
   * @param name - Unique identifier for the stage
   * @param stage - Stage instance
   */
  public registerStage(name: string, stage: Stage): void {
    this.stages.set(name, stage);
  }

  /**
   * Switches to a different stage
   * @param name - Name of the stage to switch to
   */
  public switchTo(name: string): void {
    const nextStage = this.stages.get(name);

    if (!nextStage) {
      throw new Error(`Stage '${name}' not found`);
    }

    // Exit current stage
    if (this.currentStage) {
      console.log(`Exiting stage: ${this.currentStage.name}`);
      this.currentStage.onDestroy(this.engine);
    }

    // Enter next stage
    console.log(`Entering stage: ${nextStage.name}`);
    this.currentStage = nextStage;
    this.currentStage.onInit(this.engine);
  }

  /**
   * Updates the current stage
   * @param delta - Time since last frame
   * @param elapsed - Total elapsed time
   */
  public update(delta: number, elapsed: number): void {
    if (this.currentStage) {
      this.currentStage.onUpdate(delta, elapsed, this.engine);
    }
  }

  /**
   * Gets the current stage
   */
  public getCurrentStage(): Stage | null {
    return this.currentStage;
  }

  /**
   * Gets a registered stage by name
   */
  public getStage(name: string): Stage | undefined {
    return this.stages.get(name);
  }

  /**
   * Checks if a stage is registered
   */
  public hasStage(name: string): boolean {
    return this.stages.has(name);
  }

  /**
   * Cleans up all stages
   */
  public dispose(): void {
    if (this.currentStage) {
      this.currentStage.onDestroy(this.engine);
      this.currentStage = null;
    }

    this.stages.clear();
  }
}
