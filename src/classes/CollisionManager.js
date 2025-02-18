import * as THREE from "three";

export class CollisionManager {
  constructor(scene) {
    this.scene = scene;
    this.raycaster = new THREE.Raycaster(); // Raycaster for projectile collisions
  }

  // Check for collisions between a player and static objects (optimized for walls)
  checkStaticCollisions(subject, axis = null) {
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
        if (axis === "x") {
          subjectBoundingBox.min.x += subject.velocity.x;
          subjectBoundingBox.max.x += subject.velocity.x;
        } else if (axis === "z") {
          subjectBoundingBox.min.z += subject.velocity.z;
          subjectBoundingBox.max.z += subject.velocity.z;
        } else if (axis === "y") {
          subjectBoundingBox.min.y += subject.velocity.y;
          subjectBoundingBox.max.y += subject.velocity.y;
        }

        // Check for intersection with the object.
        if (subjectBoundingBox.intersectsBox(objectBoundingBox)) {
          // Collision detected, calculate the collision normal.
          const collisionNormal = this.calculateCollisionNormal(
            subject,
            object
          );

          return collisionNormal; // Return the normal direction for the collision axis
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

  handleEnemyPlayerCollision(enemy, player) {
    // Adjust player health
    const reducedPlayerHealth =
      player.stats.currentHealth - enemy.stats.damage.melee.value;
    player.stats.currentHealth =
      reducedPlayerHealth > 0 ? reducedPlayerHealth : 0;

    console.log("Player health : ", player.stats.currentHealth);

    // Get the direction vector from the player to the enemy
    const direction = new THREE.Vector3().subVectors(
      player.camera.position,
      enemy.mesh.position
    );
    direction.normalize(); // Normalize to get the unit vector

    // Calculate the relative velocity between the player and enemy
    const playerVelocity = player.velocity.clone();
    const enemyVelocity = enemy.velocity.clone(); // Assuming enemy has a velocity property

    // Dot product to find how much the player and enemy are moving towards each other
    const relativeVelocity = playerVelocity.clone().sub(enemyVelocity);
    const velocityAlongNormal = relativeVelocity.dot(direction);

    // If they're moving towards each other (dot product < 0), we need to reflect their velocities
    if (velocityAlongNormal < 0) {
      // Reflect player velocity
      const reflectionPlayer = direction
        .clone()
        .multiplyScalar(5 * velocityAlongNormal);
      player.velocity.sub(reflectionPlayer); // Adjust player velocity

      // Reflect enemy velocity
      const reflectionEnemy = direction
        .clone()
        .multiplyScalar(-5 * velocityAlongNormal);
      enemy.velocity.sub(reflectionEnemy); // Adjust enemy velocity

      // Adjust their positions to avoid overlap
      const overlapDistance =
        player.boundingBox.getSize(new THREE.Vector3()).length() +
        enemy.boundingBox.getSize(new THREE.Vector3()).length();
      const correction = direction.clone().multiplyScalar(overlapDistance);
      player.camera.position.add(correction); // Move player
      enemy.mesh.position.sub(correction); // Move enemy
    }
  }
}
