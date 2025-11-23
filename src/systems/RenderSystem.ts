/**
 * Render System
 * 
 * Updates Three.js meshes based on entity positions
 */

import { System } from '@/core/ecs/System';
import { MeshComponent } from '@/components/MeshComponent';
import { PositionComponent } from '@/components/PositionComponent';
import { Engine } from '@/core/Engine';

export class RenderSystem extends System {
  constructor(engine: Engine) {
    super(engine.world, -100); // High priority (render early)
  }

  public update(_delta: number, _elapsed: number): void {
    const entities = this.world.query(MeshComponent, PositionComponent);

    entities.forEach((entityId) => {
      const meshComp = this.world.getComponent(entityId, MeshComponent);
      const posComp = this.world.getComponent(entityId, PositionComponent);

      if (meshComp && posComp) {
        // Sync mesh position with position component
        meshComp.mesh.position.copy(posComp.position);
      }
    });
  }
}
