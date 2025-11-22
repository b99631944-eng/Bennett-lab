/**
 * Velocity Component
 * 
 * 3D velocity for physics/movement
 */

import { Component } from '@/core/ecs/Component';
import * as THREE from 'three';

export class VelocityComponent extends Component {
  /** Velocity vector */
  public velocity: THREE.Vector3;

  constructor(entityId: number, x = 0, y = 0, z = 0) {
    super(entityId);
    this.velocity = new THREE.Vector3(x, y, z);
  }

  /**
   * Sets the velocity
   */
  public setVelocity(x: number, y: number, z: number): void {
    this.velocity.set(x, y, z);
  }

  /**
   * Adds to the current velocity
   */
  public addVelocity(x: number, y: number, z: number): void {
    this.velocity.add(new THREE.Vector3(x, y, z));
  }
}
