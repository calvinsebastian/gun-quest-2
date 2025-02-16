import * as THREE from "three";

export class CollisionManager {
  constructor(scene) {
    this.scene = scene;

    console.log(this.scene);
    this.raycaster = new THREE.Raycaster(); // Raycaster for projectile collisions
  }

  // Check for collisions between a player and static objects (optimized for walls)
  checkStaticCollisions(player) {
    this.wallObjects = this.scene.children.filter(
      (object) => object.isWall === true
    );
    for (const object of this.wallObjects) {
      if (object instanceof THREE.Mesh) {
        console.log(object);
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

  // Use raycasting to check if a projectile hits an enemy
  checkProjectileCollisionsWithRay(proj, enemy) {
    this.raycaster.ray.origin.copy(proj.origin); // Set ray start point as the projectile's position
    this.raycaster.ray.direction.copy(proj.direction); // Set ray direction from the projectile's direction

    // Check if the ray intersects with the enemy's mesh
    const intersects = this.raycaster.intersectObject(enemy.mesh);

    // If the ray intersects the enemy, handle the collision
    if (intersects.length > 0) {
      console.log("Projectile hit the enemy!");
      proj.onDestroy(proj); // Destroy the projectile
      return true; // Return true when a collision is detected
    }

    return false; // No collision
  }

  // Method for updating bounding boxes of static objects (if needed)
  updateStaticCollisions() {
    this.wallObjects = this.scene.children.filter(
      (object) => object.isWall === true
    );
  }
}
