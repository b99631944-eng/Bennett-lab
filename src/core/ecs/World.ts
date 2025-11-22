/**
 * Entity Component System - World
 * 
 * Central manager for all entities, components, and systems.
 * Provides efficient querying and iteration over entities with specific component combinations.
 */

import type { Entity } from './Entity';
import type { Component } from './Component';
import type { System } from './System';

type ComponentClass<T extends Component> = new (...args: any[]) => T;

export class World {
  /** All entities in the world */
  private entities: Map<number, Entity>;

  /** Component storage: entityId -> ComponentType -> Component */
  private components: Map<number, Map<string, Component>>;

  /** All systems registered in the world */
  private systems: System[];

  /** Cache for entity queries */
  private queryCache: Map<string, Set<number>>;

  constructor() {
    this.entities = new Map();
    this.components = new Map();
    this.systems = [];
    this.queryCache = new Map();
  }

  /**
   * Registers an entity in the world
   * @param entity - The entity to register
   */
  public addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
    this.components.set(entity.id, new Map());
  }

  /**
   * Removes an entity and all its components from the world
   * @param entityId - ID of the entity to remove
   */
  public removeEntity(entityId: number): void {
    const componentMap = this.components.get(entityId);
    
    if (componentMap) {
      // Call onDetach for all components
      componentMap.forEach((component) => {
        component.onDetach?.();
      });
    }

    this.entities.delete(entityId);
    this.components.delete(entityId);
    this.clearQueryCache();
  }

  /**
   * Adds a component to an entity
   * @param entityId - ID of the entity
   * @param component - Component to add
   */
  public addComponent(entityId: number, component: Component): void {
    const componentMap = this.components.get(entityId);
    
    if (!componentMap) {
      throw new Error(`Entity ${entityId} not found in world`);
    }

    const componentName = component.constructor.name;
    componentMap.set(componentName, component);
    component.onAttach?.();
    this.clearQueryCache();
  }

  /**
   * Removes a component from an entity
   * @param entityId - ID of the entity
   * @param componentClass - Class of the component to remove
   */
  public removeComponent<T extends Component>(
    entityId: number,
    componentClass: ComponentClass<T>
  ): void {
    const componentMap = this.components.get(entityId);
    
    if (!componentMap) {
      return;
    }

    const componentName = componentClass.name;
    const component = componentMap.get(componentName);
    
    if (component) {
      component.onDetach?.();
      componentMap.delete(componentName);
      this.clearQueryCache();
    }
  }

  /**
   * Gets a component from an entity
   * @param entityId - ID of the entity
   * @param componentClass - Class of the component to retrieve
   * @returns The component or undefined if not found
   */
  public getComponent<T extends Component>(
    entityId: number,
    componentClass: ComponentClass<T>
  ): T | undefined {
    const componentMap = this.components.get(entityId);
    
    if (!componentMap) {
      return undefined;
    }

    return componentMap.get(componentClass.name) as T | undefined;
  }

  /**
   * Checks if an entity has a specific component
   * @param entityId - ID of the entity
   * @param componentClass - Class of the component to check
   */
  public hasComponent<T extends Component>(
    entityId: number,
    componentClass: ComponentClass<T>
  ): boolean {
    const componentMap = this.components.get(entityId);
    return componentMap?.has(componentClass.name) ?? false;
  }

  /**
   * Queries all entities that have ALL specified components
   * @param componentClasses - Component classes to query for
   * @returns Set of entity IDs matching the query
   */
  public query(...componentClasses: ComponentClass<Component>[]): Set<number> {
    const cacheKey = componentClasses.map(c => c.name).sort().join(',');
    
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey)!;
    }

    const result = new Set<number>();

    this.entities.forEach((entity) => {
      if (!entity.active) return;

      const hasAll = componentClasses.every(componentClass =>
        this.hasComponent(entity.id, componentClass)
      );

      if (hasAll) {
        result.add(entity.id);
      }
    });

    this.queryCache.set(cacheKey, result);
    return result;
  }

  /**
   * Gets an entity by ID
   * @param entityId - ID of the entity
   */
  public getEntity(entityId: number): Entity | undefined {
    return this.entities.get(entityId);
  }

  /**
   * Adds a system to the world
   * @param system - The system to add
   */
  public addSystem(system: System): void {
    this.systems.push(system);
    this.systems.sort((a, b) => a.priority - b.priority);
    system.onInit?.();
  }

  /**
   * Removes a system from the world
   * @param system - The system to remove
   */
  public removeSystem(system: System): void {
    const index = this.systems.indexOf(system);
    if (index !== -1) {
      system.onDestroy?.();
      this.systems.splice(index, 1);
    }
  }

  /**
   * Updates all active systems
   * @param delta - Time since last frame in seconds
   * @param elapsed - Total elapsed time in seconds
   */
  public update(delta: number, elapsed: number): void {
    for (const system of this.systems) {
      if (system.enabled) {
        system.update(delta, elapsed);
      }
    }
  }

  /**
   * Clears the query cache (called when entities/components change)
   */
  private clearQueryCache(): void {
    this.queryCache.clear();
  }

  /**
   * Gets the total number of entities
   */
  public getEntityCount(): number {
    return this.entities.size;
  }

  /**
   * Gets all systems
   */
  public getSystems(): readonly System[] {
    return this.systems;
  }

  /**
   * Clears all entities, components, and systems
   */
  public clear(): void {
    // Clean up all systems
    this.systems.forEach(system => system.onDestroy?.());
    this.systems = [];

    // Clean up all components
    this.components.forEach((componentMap) => {
      componentMap.forEach((component) => {
        component.onDetach?.();
      });
    });

    this.entities.clear();
    this.components.clear();
    this.queryCache.clear();
  }
}
