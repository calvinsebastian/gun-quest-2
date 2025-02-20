// In Projectile.js

export class Projectile {
  constructor(scene, origin, direction, onDestroy) {
    this.scene = scene;
    this.onDestroy = onDestroy;
    this.origin = origin;
    this.direction = direction.clone().normalize();
    this.age = 0;
    this.lifetime = 0.5; // Lifetime in seconds

    // Ensure the direction vector is normalized.

    // Initialize mesh (e.g., a small sphere representing the projectile)
    // const geometry = new THREE.SphereGeometry(0.025, 8, 8);
    // const material = new THREE.MeshStandardMaterial({
    //   color: 0xb08d57, // Bronzy gold color
    //   metalness: 0.8, // High metalness to make it shiny
    //   roughness: 0.4, // Slight roughness to give a realistic metallic surface
    // });
    // this.mesh = new THREE.Mesh(geometry, material);
    // this.mesh.position.copy(origin); // Start at the origin

    // this.boundingBox = new THREE.Box3().setFromObject(this.mesh);

    // this.scene.add(this.mesh);

    this.speed = 100; // The speed of the projectile (adjust to your needs)
  }

  update(deltaTime) {
    // Move the projectile in the direction it's facing
    // const velocity = this.direction.clone().multiplyScalar(this.speed);
    // this.mesh.position.add(velocity.multiplyScalar(deltaTime));

    // Update the age of the projectile
    this.age += deltaTime;

    // If the projectile has lived too long, remove it
    if (this.age > this.lifetime) {
      this.scene.remove(this.mesh);

      if (this.onDestroy) {
        this.onDestroy(this);
      }
    }
  }
}
