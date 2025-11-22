/**
 * Entity Component System - Component
 * 
 * Abstract base class for all data components.
 * Components are pure data containers attached to entities.
 */

export abstract class Component {
  /** The entity this component belongs to */
  public entityId: number;

  /**
   * Creates a new component
   * @param entityId - ID of the entity this component belongs to
   */
  constructor(entityId: number) {
    this.entityId = entityId;
  }

  /**
   * Called when the component is added to an entity
   * Override for initialization logic
   */
  public onAttach?(): void;

  /**
   * Called when the component is removed from an entity
   * Override for cleanup logic
   */
  public onDetach?(): void;
}
