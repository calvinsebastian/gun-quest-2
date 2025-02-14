// In Projectile.js
import * as THREE from "three";

export class Projectile {
  constructor(scene, origin, direction, onDestroy) {
    this.scene = scene;
    this.onDestroy = onDestroy;
    this.age = 0;
    this.lifetime = 0.5; // Lifetime in seconds

    // Ensure the direction vector is normalized.
    this.direction = direction.clone().normalize();

    console.log("Projectile direction on creation: ", this.direction);

    // Initialize mesh (e.g., a small sphere representing the projectile)
    const geometry = new THREE.SphereGeometry(0.025, 8, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0xb08d57, // Bronzy gold color
      metalness: 0.8, // High metalness to make it shiny
      roughness: 0.4, // Slight roughness to give a realistic metallic surface
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(origin); // Start at the origin
    this.scene.add(this.mesh);

    this.speed = 150; // The speed of the projectile (adjust to your needs)
  }

  update(deltaTime) {
    // Move the projectile in the direction it's facing

    console.log("Projectile Position: ", this.mesh.position);
    console.log("Projectile Direction: ", this.direction);

    // Move the projectile in the direction it's facing
    const velocity = this.direction.clone().multiplyScalar(this.speed);
    this.mesh.position.add(velocity.multiplyScalar(deltaTime));

    // Update the age of the projectile
    this.age += deltaTime;

    console.log(this.age);

    // If the projectile has lived too long, remove it
    if (this.age > this.lifetime) {
      this.scene.remove(this.mesh);

      if (this.onDestroy) {
        console.log("Destroying Projectile");
        this.onDestroy(this);
      }
    }
  }
}
