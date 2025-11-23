/**
 * Entity Component System - Entity
 * 
 * A lightweight container representing a game object.
 * Entities are just unique IDs that hold references to components.
 */

export class Entity {
  private static nextId = 0;
  
  /** Unique identifier for this entity */
  public readonly id: number;
  
  /** Human-readable name for debugging */
  public name: string;
  
  /** Active state - inactive entities are not processed by systems */
  public active: boolean;

  /**
   * Creates a new entity
   * @param name - Optional name for debugging purposes
   */
  constructor(name = `Entity_${Entity.nextId}`) {
    this.id = Entity.nextId++;
    this.name = name;
    this.active = true;
  }

  /**
   * Deactivates the entity (won't be processed by systems)
   */
  public deactivate(): void {
    this.active = false;
  }

  /**
   * Activates the entity
   */
  public activate(): void {
    this.active = true;
  }

  /**
   * Gets a unique string representation
   */
  public toString(): string {
    return `${this.name}#${this.id}`;
  }
}
