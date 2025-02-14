import * as THREE from "three";

export class Enemy {
  constructor(scene, player, speed = 5) {
    this.scene = scene;
    this.player = player; // Reference to the player object
    this.speed = speed; // Movement speed of the enemy

    // Initialize enemy mesh (you can customize this as needed)
    const geometry = new THREE.SphereGeometry(0.3, 16, 16); // Sphere for the enemy
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
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
    // Get direction vector from the enemy to the player
    const playerCenter = new THREE.Vector3();
    this.player.boundingBox.getCenter(playerCenter);

    // Get direction vector from the enemy to the player
    const direction = new THREE.Vector3();
    direction.subVectors(playerCenter, this.mesh.position); // Direction from enemy to player
    direction.y = 0; // Ignore vertical movement (for flat movement on the ground)

    // Normalize direction vector to get direction and scale by speed
    direction.normalize();

    // Move the enemy towards the player
    this.mesh.position.add(direction.multiplyScalar(this.speed * deltaTime));

    // Update the bounding box to match the enemy's new position
    this.boundingBox.setFromObject(this.mesh);
  }
}
