/**
 * Entity Component System - System
 * 
 * Abstract base class for all systems that process entities with specific components.
 * Systems contain the logic that operates on component data.
 */

import type { World } from './World';

export abstract class System {
  /** Reference to the ECS world */
  protected world: World;

  /** Whether this system is currently enabled */
  public enabled: boolean;

  /** Execution priority (lower numbers run first) */
  public priority: number;

  /**
   * Creates a new system
   * @param world - The ECS world this system belongs to
   * @param priority - Execution order (default: 0)
   */
  constructor(world: World, priority = 0) {
    this.world = world;
    this.enabled = true;
    this.priority = priority;
  }

  /**
   * Called once when the system is added to the world
   */
  public onInit?(): void;

  /**
   * Called every frame to process entities
   * @param delta - Time since last frame in seconds
   * @param elapsed - Total elapsed time in seconds
   */
  public abstract update(delta: number, elapsed: number): void;

  /**
   * Called when the system is removed from the world
   */
  public onDestroy?(): void;

  /**
   * Enable the system
   */
  public enable(): void {
    this.enabled = true;
  }

  /**
   * Disable the system (won't be updated)
   */
  public disable(): void {
    this.enabled = false;
  }
}
