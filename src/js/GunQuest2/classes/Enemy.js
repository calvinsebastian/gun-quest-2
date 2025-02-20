// import * as THREE from "three";
// import { playSound } from "./SoundManager";

// export class Enemy {
//   constructor(scene, level, player, enemyConfig, onDestroy) {
//     // Assign the uuid and other properties
//     this.uuid = enemyConfig.uuid;
//     this.scene = scene;
//     this.player = player;
//     this.onDestroy = onDestroy;

//     // Initialize the stats, including health
//     this.stats = {
//       currentHealth: enemyConfig.stats?.currentHealth || 100, // Default to 100 if not provided
//       maxHealth: enemyConfig.stats?.maxHealth || 100,
//       damage: enemyConfig.stats?.damage || { melee: { value: 10 } },
//       speed: enemyConfig.stats?.speed || 1, // Default speed if not provided
//     };

//     // Initialize enemy mesh (you can customize this as needed)
//     const geometry = new THREE.SphereGeometry(enemyConfig.size, 16, 16); // Sphere for the enemy
//     const material = new THREE.MeshStandardMaterial({
//       color: enemyConfig.color,
//       emissive: 0x000000, // No emission, will only be lit by scene lights
//       roughness: 0.5, // Adjust roughness to suit your needs
//       metalness: 0.5, // Adjust metalness to suit your needs
//     });
//     this.mesh = new THREE.Mesh(geometry, material);

//     // Set enemy's starting position 20, 1, 30
//     this.mesh.position.set(
//       enemyConfig.position.x,
//       enemyConfig.position.y,
//       enemyConfig.position.z
//     ); // Start at some position
//     this.scene.add(this.mesh);

//     // Create a bounding box for the enemy
//     this.boundingBox = new THREE.Box3().setFromObject(this.mesh);

//     // Initialize velocity (initially 0, no movement)
//     this.velocity = new THREE.Vector3(0, 0, 0);
//   }

//   // Method to update the enemy's position and velocity towards the player
//   update(deltaTime) {
//     // If the enemy's health is <= 0, destroy it
//     if (this.stats.currentHealth <= 0) {
//       this.scene.remove(this.mesh);

//       if (this.onDestroy) {
//         console.log("Enemy destroyed:", this.uuid);
//         this.onDestroy(this);
//       }
//       return; // Skip further updates for this "dead" enemy
//     }

//     // If there's knockback, skip the regular movement
//     if (this.isKnockedBack) {
//       this.mesh.position.add(this.velocity.multiplyScalar(deltaTime)); // Apply knockback
//       return; // Skip the rest of the update
//     }

//     // Get direction vector from the enemy to the player
//     const playerCenter = new THREE.Vector3();
//     this.player.boundingBox.getCenter(playerCenter);

//     const direction = new THREE.Vector3();
//     direction.subVectors(playerCenter, this.mesh.position); // Direction from enemy to player
//     direction.y = 0; // Ignore vertical movement (for flat movement on the ground)
//     direction.normalize(); // Normalize the direction vector

//     // Reset velocity to avoid accumulating it and make movement controlled
//     this.velocity = direction.multiplyScalar(this.stats.speed); // Calculate velocity towards the player

//     // Move the enemy based on velocity
//     this.mesh.position.add(this.velocity.multiplyScalar(deltaTime)); // Apply movement based on velocity

//     // Update the bounding box to match the enemy's new position
//     this.boundingBox.setFromObject(this.mesh);
//   }

//   // Method to handle taking damage (e.g., by a projectile)
//   takeDamage(amount) {
//     this.stats.currentHealth =
//       this.stats.currentHealth - this.player.weapon.damage > 0
//         ? this.stats.currentHealth - this.player.weapon.damage
//         : 0;

//     console.log(
//       `Enemy ${this.uuid} took ${amount} damage. Current health: ${this.stats.currentHealth}`
//     );

//     if (this.stats.currentHealth <= 0) {
//       console.log(`Enemy ${this.uuid} is dead.`);
//       this.scene.remove(this.mesh);
//       this.onDestroy(this);
//     }
//   }
// }

import * as THREE from "three";
import { getGridPosition } from "../js/utility";

export class Enemy {
  constructor(scene, level, player, enemyConfig, onDestroy) {
    this.uuid = enemyConfig.uuid;
    this.scene = scene;
    this.level = level; // Store level reference for pathfinding
    this.player = player;
    this.onDestroy = onDestroy;
    this.velocity = new THREE.Vector3(0, 0, 0); // Initialize velocity
    this.isKnockedBack = false; // Track knockback state

    // Enemy attributes
    this.stats = {
      currentHealth: enemyConfig.stats?.currentHealth || 100,
      maxHealth: enemyConfig.stats?.maxHealth || 100,
      speed: enemyConfig.stats?.speed || 1,
      damage: enemyConfig.stats?.damage || { melee: { value: 10 } },
    };

    // Enemy Mesh
    const geometry = new THREE.SphereGeometry(enemyConfig.size, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: enemyConfig.color,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(enemyConfig.position.x, 1, enemyConfig.position.z);
    this.scene.add(this.mesh);

    this.boundingBox = new THREE.Box3().setFromObject(this.mesh);

    // Pathfinding data
    this.path = [];
    this.currentTargetIndex = 0;

    // Compute initial path
    this.computePath();
  }

  computePath() {
    const start = getGridPosition(
      Math.round(this.mesh.position.x),
      Math.round(this.mesh.position.z)
    );

    const end = getGridPosition(
      Math.round(this.player.camera.position.x),
      Math.round(this.player.camera.position.z)
    );

    this.path = this.level.getPath(start, end);
    this.currentTargetIndex = 0;
  }

  takeDamage(amount) {
    const originalColor = this.mesh.material.color.clone();
    this.mesh.material.color.set(0xff0000);

    this.stats.currentHealth =
      this.stats.currentHealth - this.player.weapon.damage > 0
        ? this.stats.currentHealth - this.player.weapon.damage
        : 0;

    console.log(
      `Enemy ${this.uuid} took ${amount} damage. Current health: ${this.stats.currentHealth}`
    );

    if (this.stats.currentHealth <= 0) {
      console.log(`Enemy ${this.uuid} is dead.`);
      this.scene.remove(this.mesh);
      this.onDestroy(this);
    }

    // Flash red effect

    setTimeout(() => {
      this.mesh.material.color.copy(originalColor); // Revert back
    }, 30); // Flash duration
  }

  update(deltaTime) {
    if (this.stats.currentHealth <= 0) {
      this.scene.remove(this.mesh);
      if (this.onDestroy) this.onDestroy(this);
      return;
    }

    const enemyPos = this.mesh.position;
    const playerPos = new THREE.Vector3(
      this.player.camera.position.x,
      1,
      this.player.camera.position.z
    );

    const distanceToPlayer = enemyPos.distanceTo(playerPos);

    if (distanceToPlayer < 2) {
      const directionToPlayer = playerPos.clone().sub(enemyPos).normalize();
      if (!this.isKnockedBack) {
        this.velocity.copy(directionToPlayer).multiplyScalar(this.stats.speed);
      }
    } else {
      // **Pathfinding movement**
      if (
        this.path.length === 0 ||
        this.currentTargetIndex >= this.path.length
      ) {
        this.computePath();
        return;
      }

      const target = this.path[this.currentTargetIndex];
      const targetPosition = new THREE.Vector3(target.x, 1, target.z);

      const direction = targetPosition.clone().sub(enemyPos).normalize();

      if (!this.isKnockedBack) {
        this.velocity.copy(direction).multiplyScalar(this.stats.speed);
      }

      if (enemyPos.distanceTo(targetPosition) < 0.5) {
        this.currentTargetIndex++; // Move to next target
      }
    }

    if (!this.lastLogTime || performance.now() - this.lastLogTime > 1000) {
      const lastTarget = this.path[this.path.length - 1]; // Last target position in the path

      // Get the player's current position
      const playerPos = new THREE.Vector3(
        this.player.camera.position.x,
        0, // y is usually not considered in this kind of check (flat ground)
        this.player.camera.position.z
      );

      // Get the position of the last waypoint (target)
      const targetPos = new THREE.Vector3(lastTarget.x, 0, lastTarget.z);

      // Check if the last target position is close enough to the player's position
      const distanceToPlayer = targetPos.distanceTo(playerPos);
      console.log(`The enemy is ${distanceToPlayer} meters away`);

      this.lastLogTime = performance.now();
    }

    // **Apply velocity**
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    this.boundingBox.setFromObject(this.mesh);
  }
}
