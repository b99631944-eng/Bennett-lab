/**
 * Position Component
 * 
 * 3D position data for an entity
 */

import { Component } from '@/core/ecs/Component';
import * as THREE from 'three';

export class PositionComponent extends Component {
  /** 3D position vector */
  public position: THREE.Vector3;

  constructor(entityId: number, x = 0, y = 0, z = 0) {
    super(entityId);
    this.position = new THREE.Vector3(x, y, z);
  }

  /**
   * Sets the position
   */
  public setPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z);
  }

  /**
   * Gets the position as an array
   */
  public toArray(): [number, number, number] {
    return [this.position.x, this.position.y, this.position.z];
  }
}
