import * as THREE from "three";
import { playSound } from "../audio/soundManager";

export class Enemy {
  constructor(scene, player, enemyConfig, onDestroy) {
    console.log("I am aliiiiiiivvee!", enemyConfig);

    // Assign the uuid and other properties
    this.uuid = enemyConfig.uuid;
    this.scene = scene;
    this.player = player;
    this.onDestroy = onDestroy;

    // Initialize the stats, including health
    this.stats = {
      currentHealth: enemyConfig.stats?.currentHealth || 100, // Default to 100 if not provided
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

    // Set enemy's starting position
    this.mesh.position.set(20, 1, 30); // Start at some position
    this.scene.add(this.mesh);

    // Create a bounding box for the enemy
    this.boundingBox = new THREE.Box3().setFromObject(this.mesh);
  }

  // Method to update the enemy's position towards the player
  update(deltaTime) {
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

    // Move the enemy towards the player
    this.mesh.position.add(
      direction.multiplyScalar(this.stats.speed * deltaTime)
    );

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

    playSound("/audio/assets/effects/hit.wav", 0.5);
    if (this.stats.currentHealth <= 0) {
      console.log(`Enemy ${this.uuid} is dead.`);
      this.scene.remove(this.mesh);
      this.onDestroy(this);
    }
  }
}
