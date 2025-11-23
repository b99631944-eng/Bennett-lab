/**
 * AR Stage
 * 
 * Augmented Reality stage that integrates camera feed as scene background.
 * Sets up AR-appropriate lighting and camera configuration.
 */

import * as THREE from 'three';
import { Stage } from '@/core/SceneManager';
import { Engine } from '@/core/Engine';
import { CameraFeed } from '@/core/device/CameraFeed';
import { Entity } from '@/core/ecs/Entity';
import { MeshComponent } from '@/components/MeshComponent';
import { PositionComponent } from '@/components/PositionComponent';

export class ARStage implements Stage {
  public readonly name = 'ARStage';

  private cameraFeed: CameraFeed | null;
  private ambientLight: THREE.AmbientLight | null;
  private directionalLight: THREE.DirectionalLight | null;
  private demoEntity: Entity | null;

  constructor() {
    this.cameraFeed = null;
    this.ambientLight = null;
    this.directionalLight = null;
    this.demoEntity = null;
  }

  /**
   * Initializes the AR stage
   */
  public async onInit(engine: Engine): Promise<void> {
    console.log('🎯 Initializing AR Stage');

    // Lock camera to fixed position for AR
    engine.camera.position.set(0, 0, 0);
    engine.camera.rotation.set(0, 0, 0);

    // Start camera feed
    this.cameraFeed = new CameraFeed({
      facingMode: 'environment',
    });

    try {
      await this.cameraFeed.start();

      // Set camera feed as scene background
      const texture = this.cameraFeed.getTexture();
      if (texture) {
        engine.scene.background = texture;
      }

    } catch (error) {
      console.error('Failed to start camera feed:', error);
      // Continue without camera feed (fallback to black background)
    }

    // Setup AR lighting (mimics real-world lighting)
    this.setupLighting(engine);

    // Add demo cube for testing
    this.createDemoCube(engine);

    console.log('✅ AR Stage initialized');
  }

  /**
   * Sets up AR-appropriate lighting
   */
  private setupLighting(engine: Engine): void {
    // Ambient light - soft overall illumination
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    engine.scene.add(this.ambientLight);

    // Directional light - simulates sunlight
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(5, 10, 7.5);
    this.directionalLight.castShadow = true;

    // Configure shadow properties
    this.directionalLight.shadow.camera.near = 0.1;
    this.directionalLight.shadow.camera.far = 50;
    this.directionalLight.shadow.camera.left = -10;
    this.directionalLight.shadow.camera.right = 10;
    this.directionalLight.shadow.camera.top = 10;
    this.directionalLight.shadow.camera.bottom = -10;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;

    engine.scene.add(this.directionalLight);

    // Enable shadows on renderer
    engine.renderer.shadowMap.enabled = true;
    engine.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  /**
   * Creates a demo cube for testing
   */
  private createDemoCube(engine: Engine): void {
    // Create cube geometry and material
    const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4a90e2,
      metalness: 0.3,
      roughness: 0.4,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Add to scene
    engine.scene.add(mesh);

    // Create entity with ECS
    this.demoEntity = new Entity('DemoCube');
    engine.world.addEntity(this.demoEntity);

    // Add components
    const positionComp = new PositionComponent(this.demoEntity.id, 0, 0, -1);
    const meshComp = new MeshComponent(this.demoEntity.id, mesh);

    engine.world.addComponent(this.demoEntity.id, positionComp);
    engine.world.addComponent(this.demoEntity.id, meshComp);
  }

  /**
   * Updates the AR stage
   */
  public onUpdate(_delta: number, elapsed: number, engine: Engine): void {
    // Rotate demo cube
    if (this.demoEntity) {
      const posComp = engine.world.getComponent(this.demoEntity.id, PositionComponent);
      const meshComp = engine.world.getComponent(this.demoEntity.id, MeshComponent);

      if (meshComp) {
        // Smooth rotation
        meshComp.mesh.rotation.x = elapsed * 0.5;
        meshComp.mesh.rotation.y = elapsed * 0.7;

        // Gentle floating motion
        if (posComp) {
          posComp.position.y = Math.sin(elapsed * 2) * 0.1;
        }
      }
    }
  }

  /**
   * Cleans up the AR stage
   */
  public onDestroy(engine: Engine): void {
    console.log('🧹 Cleaning up AR Stage');

    // Stop camera feed
    if (this.cameraFeed) {
      this.cameraFeed.stop();
      this.cameraFeed = null;
    }

    // Remove lights
    if (this.ambientLight) {
      engine.scene.remove(this.ambientLight);
      this.ambientLight = null;
    }

    if (this.directionalLight) {
      engine.scene.remove(this.directionalLight);
      this.directionalLight = null;
    }

    // Remove demo entity
    if (this.demoEntity) {
      const meshComp = engine.world.getComponent(this.demoEntity.id, MeshComponent);
      if (meshComp) {
        engine.scene.remove(meshComp.mesh);
        meshComp.mesh.geometry.dispose();
        (meshComp.mesh.material as THREE.Material).dispose();
      }

      engine.world.removeEntity(this.demoEntity.id);
      this.demoEntity = null;
    }

    // Reset scene background
    engine.scene.background = null;

    console.log('✅ AR Stage cleaned up');
  }
}
