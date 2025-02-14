import * as THREE from "three";

export class CollisionManager {
  constructor(scene) {
    this.scene = scene;
  }

  // Check for collisions between a player and static objects
  checkStaticCollisions(player) {
    player.boundingBox.setFromObject(player.playerMesh);
    const objectsInScene = this.scene.children.filter(
      (object) => object.isWall === true
    );

    for (const object of objectsInScene) {
      if (object instanceof THREE.Mesh) {
        const objectBoundingBox = new THREE.Box3().setFromObject(object);
        if (player.boundingBox.intersectsBox(objectBoundingBox)) {
          // Collision detected, return true
          return true;
        }
      }
    }
    return false;
  }

  // Check for enemy collisions with the player
  checkEnemyCollisions(enemy, player) {
    if (enemy.boundingBox.intersectsBox(player.boundingBox)) {
      // Collision detected
      return true;
    }
    return false;
  }

  checkProjectileCollisions(projectile, entity) {
    if (projectile.boundingBox.intersectsBox(entity.boundingBox)) {
      // Collision detected
      return true;
    }
    return false;
  }
}
