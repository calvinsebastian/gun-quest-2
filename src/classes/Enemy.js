import * as THREE from "three";
import { playSound } from "../audio/soundManager";

export class Enemy {
  constructor(scene, player, enemyConfig, onDestroy) {
    // Assign the uuid and other properties
    this.uuid = enemyConfig.uuid;
    this.scene = scene;
    this.player = player;
    this.onDestroy = onDestroy;

    // Initialize the stats, including health
    this.stats = {
      currentHealth: enemyConfig.stats?.currentHealth || 100, // Default to 100 if not provided
      maxHealth: enemyConfig.stats?.maxHealth || 100,
      damage: enemyConfig.stats?.damage || { melee: { value: 10 } },
      speed: enemyConfig.stats?.speed || 1, // Default speed if not provided
    };

    // Initialize enemy mesh (you can customize this as needed)
    const geometry = new THREE.SphereGeometry(enemyConfig.size, 16, 16); // Sphere for the enemy
    const material = new THREE.MeshStandardMaterial({
      color: enemyConfig.color,
      emissive: 0x000000, // No emission, will only be lit by scene lights
      roughness: 0.5, // Adjust roughness to suit your needs
      metalness: 0.5, // Adjust metalness to suit your needs
    });
    this.mesh = new THREE.Mesh(geometry, material);

    // Set enemy's starting position 20, 1, 30
    this.mesh.position.set(
      enemyConfig.position.x,
      enemyConfig.position.y,
      enemyConfig.position.z
    ); // Start at some position
    this.scene.add(this.mesh);

    // Create a bounding box for the enemy
    this.boundingBox = new THREE.Box3().setFromObject(this.mesh);

    // Initialize velocity (initially 0, no movement)
    this.velocity = new THREE.Vector3(0, 0, 0);
  }

  // Method to update the enemy's position and velocity towards the player
  update(deltaTime) {
    console.log(this.mesh.position); // Debugging the position to track movement

    // If the enemy's health is <= 0, destroy it
    if (this.stats.currentHealth <= 0) {
      this.scene.remove(this.mesh);

      if (this.onDestroy) {
        console.log("Enemy destroyed:", this.uuid);
        this.onDestroy(this);
      }
      return; // Skip further updates for this "dead" enemy
    }

    // Get direction vector from the enemy to the player
    const playerCenter = new THREE.Vector3();
    this.player.boundingBox.getCenter(playerCenter);

    const direction = new THREE.Vector3();
    direction.subVectors(playerCenter, this.mesh.position); // Direction from enemy to player
    direction.y = 0; // Ignore vertical movement (for flat movement on the ground)
    direction.normalize(); // Normalize the direction vector

    // Reset velocity to avoid accumulating it and make movement controlled
    this.velocity = direction.multiplyScalar(this.stats.speed); // Calculate velocity towards the player

    // Move the enemy based on velocity
    this.mesh.position.add(this.velocity.multiplyScalar(deltaTime)); // Apply movement based on velocity

    // Update the bounding box to match the enemy's new position
    this.boundingBox.setFromObject(this.mesh);
  }

  // Method to handle taking damage (e.g., by a projectile)
  takeDamage(amount) {
    this.stats.currentHealth =
      this.stats.currentHealth - this.player.weapon.damage > 0
        ? this.stats.currentHealth - this.player.weapon.damage
        : 0;

    console.log(
      `Enemy ${this.uuid} took ${amount} damage. Current health: ${this.stats.currentHealth}`
    );

    playSound(
      this.stats.currentHealth > 0
        ? "/audio/assets/effects/hit.wav"
        : "/audio/assets/effects/death.wav",
      0.5
    );
    if (this.stats.currentHealth <= 0) {
      console.log(`Enemy ${this.uuid} is dead.`);
      this.scene.remove(this.mesh);
      this.onDestroy(this);
    }
  }
}
