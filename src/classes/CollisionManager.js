import * as THREE from "three";

export class CollisionManager {
  constructor(scene) {
    this.scene = scene;
    this.wallObjects = this.scene.children.filter(
      (object) => object.isWall === true
    ); // Static objects (walls) only need to be checked once
  }

  // Check for collisions between a player and static objects (optimized for walls)
  checkStaticCollisions(player) {
    player.boundingBox.setFromObject(player.playerMesh);

    for (const object of this.wallObjects) {
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

  // Check for enemy collisions with the player (only dynamic objects)
  checkEnemyCollisions(enemy, player) {
    if (enemy.boundingBox.intersectsBox(player.boundingBox)) {
      // Collision detected
      return true;
    }
    return false;
  }

  // Check for projectile collisions (with dynamic objects like enemies)
  checkProjectileCollisions(projectile, entity) {
    if (projectile.boundingBox.intersectsBox(entity.boundingBox)) {
      // Collision detected
      return true;
    }
    return false;
  }

  // Method for updating bounding boxes of static objects (if needed)
  updateStaticCollisions() {
    this.wallObjects = this.scene.children.filter(
      (object) => object.isWall === true
    );
  }
}
