import * as THREE from "three";

export class CollisionManager {
  constructor(scene) {
    this.scene = scene;

    console.log(this.scene);
    this.raycaster = new THREE.Raycaster(); // Raycaster for projectile collisions
  }

  // Check for collisions between a player and static objects (optimized for walls)
  checkStaticCollisions(subject) {
    const classInstance = subject.constructor.name;
    this.collisionObjects = this.scene.children.filter((object) => {
      if (object.collision) {
        return object.collision[classInstance];
      }
    });

    // Check collision for all movement directions for the full bounding box.
    for (const object of this.collisionObjects) {
      if (object instanceof THREE.Mesh) {
        const objectBoundingBox = new THREE.Box3().setFromObject(object);
        const subjectBoundingBox = subject.boundingBox.clone();

        // Move the player's bounding box based on their velocity to predict collisions.
        subjectBoundingBox.min.add(subject.velocity);
        subjectBoundingBox.max.add(subject.velocity);

        // Check for intersection with the object.
        if (subjectBoundingBox.intersectsBox(objectBoundingBox)) {
          // Collision detected, calculate the collision normal.
          const collisionNormal = this.calculateCollisionNormal(
            subject,
            object
          );

          // Optionally, check for velocity in the direction of the normal and adjust.
          const dotProduct = subject.velocity.dot(collisionNormal);

          if (dotProduct < 0) {
            // If moving towards the wall, stop movement along the normal (perpendicular to the wall)
            const velocityAlongNormal = collisionNormal
              .clone()
              .multiplyScalar(dotProduct);
            subject.velocity.sub(velocityAlongNormal); // Stop movement into the wall.

            // Allow sliding along the wall (apply velocity parallel to the wall)
            const parallelVelocity = subject.velocity.clone();
            parallelVelocity.y = 0; // Ensure no vertical movement during collision
            subject.camera.position.add(parallelVelocity); // Apply movement along the wall.
            subject.playerMesh.position.copy(subject.camera.position);
            subject.boundingBox.setFromObject(subject.playerMesh);

            // Apply friction to slow the player down.
            subject.velocity.multiplyScalar(0.95); // Adjust friction as needed.
          }

          return collisionNormal; // Return the normal direction
        }
      }
    }

    return null; // No collision detected
  }

  calculateCollisionNormal(subject, object) {
    const subjectPosition = subject.camera.position;
    const objectPosition = object.position;

    const direction = new THREE.Vector3().subVectors(
      subjectPosition,
      objectPosition
    );
    const absDirection = direction.clone().normalize();

    let normal = new THREE.Vector3(0, 0, 0);

    const objectBoundingBox = new THREE.Box3().setFromObject(object);
    const closestPoint = new THREE.Vector3();
    objectBoundingBox.clampPoint(subjectPosition, closestPoint); // Get closest point on wall

    const offset = new THREE.Vector3().subVectors(
      subjectPosition,
      closestPoint
    );
    const absOffset = offset.clone().normalize();

    // Assign normal based on the smallest offset (closest side)
    if (
      Math.abs(absOffset.x) > Math.abs(absOffset.y) &&
      Math.abs(absOffset.x) > Math.abs(absOffset.z)
    ) {
      normal.x = offset.x > 0 ? 1 : -1;
    } else if (
      Math.abs(absOffset.y) > Math.abs(absOffset.x) &&
      Math.abs(absOffset.y) > Math.abs(absOffset.z)
    ) {
      normal.y = offset.y > 0 ? 1 : -1;
    } else {
      normal.z = offset.z > 0 ? 1 : -1;
    }

    return normal;
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
}
