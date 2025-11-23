/**
 * Mesh Component
 * 
 * Three.js mesh reference for rendering
 */

import { Component } from '@/core/ecs/Component';
import * as THREE from 'three';

export class MeshComponent extends Component {
  /** Three.js mesh */
  public mesh: THREE.Mesh;

  constructor(entityId: number, mesh: THREE.Mesh) {
    super(entityId);
    this.mesh = mesh;
  }

  /**
   * Updates the mesh visibility
   */
  public setVisible(visible: boolean): void {
    this.mesh.visible = visible;
  }

  /**
   * Gets the mesh position
   */
  public getPosition(): THREE.Vector3 {
    return this.mesh.position;
  }

  /**
   * Sets the mesh position
   */
  public setPosition(x: number, y: number, z: number): void {
    this.mesh.position.set(x, y, z);
  }
}
