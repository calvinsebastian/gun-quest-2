import * as THREE from "three";
import { getGridPosition } from "../js/utility";

export class Enemy {
  constructor(scene, level, player, enemyConfig, onDestroy) {
    this.uuid = enemyConfig.uuid;
    this.rareSpawn = enemyConfig.rareSpawn;
    this.scene = scene;
    this.level = level; // Store level reference for pathfinding
    this.player = player;
    this.collisionManager = this.player.collisionManager;
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

    this.points = enemyConfig.points || 10;

    // Enemy Mesh
    const geometry = new THREE.SphereGeometry(enemyConfig.size, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: enemyConfig.color,
      opacity: 0.9,
      transparent: false,
      roughness: 0.95,
      metalness: 0.1,
      side: THREE.FrontSide,
      envMapIntensity: 1,
      emissive: enemyConfig.color,
      emissiveIntensity: this.rareSpawn ? 1 : 0,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    if (enemyConfig.rareSpawn) {
      this.innerLight = new THREE.PointLight(enemyConfig.color, 1.5, 3.5, 2);
      this.mesh.add(this.innerLight);
    }
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
    const originalSpeed = this.stats.speed;
    const originalColor = this.mesh.material.color.clone();
    this.mesh.material.color.set(0xff0000);
    this.mesh.material.emissive.set(0xff0000);
    if (this.rareSpawn) {
      this.innerLight.color.set(0xff0000);
    }
    this.stats.speed = originalSpeed + 2;

    this.stats.currentHealth =
      this.stats.currentHealth - this.player.weapon.damage > 0
        ? this.stats.currentHealth - this.player.weapon.damage
        : 0;

    this.applyKnockback();

    setTimeout(() => {
      this.mesh.material.color.copy(originalColor); // Revert back
      this.mesh.material.emissive.copy(originalColor);
      if (this.rareSpawn) {
        this.innerLight.color.set(originalColor);
      }
      this.stats.speed = originalSpeed;
    }, 50); // Flash duration
  }

  applyKnockback() {
    const knockbackDistance = 2; // Total knockback distance
    const knockbackDirection = this.mesh.position
      .clone()
      .sub(this.player.camera.position)
      .normalize(); // Direction away from the player

    const steps = 10; // Number of steps for applying knockback (to simulate continuous movement)
    const stepDistance = knockbackDistance / steps; // Distance to move each step

    let currentPosition = this.mesh.position.clone(); // Current position of the enemy

    for (let i = 0; i < steps; i++) {
      // Calculate the new position by moving a small step along the knockback direction
      const newPosition = currentPosition
        .clone()
        .add(knockbackDirection.multiplyScalar(stepDistance));

      // Check if the new position causes a collision with walls or other enemies
      if (!this.collisionManager.checkStaticCollisions(this)) {
        // If no collision, update position
        currentPosition = newPosition;
      } else {
        // Stop applying knockback if a collision is detected
        console.log("Collision detected, knockback stopped");
        break;
      }
    }

    // Apply the final position after knockback (could be further tweaked)
    this.mesh.position.copy(currentPosition);
  }

  explode() {
    const numFragments = 7; // Number of chunks
    const originalPosition = this.mesh.position.clone();
    const originalColor = this.mesh.material.color.clone();
    const groundLevel = 0; // Set the ground level (Y-position) for the floor

    for (let i = 0; i < numFragments; i++) {
      // Create solid chunks (e.g., use BoxGeometry to represent the chunks)
      const chunkGeometry = new THREE.BoxGeometry(
        Math.random() * (0.5 - 0.25) + 0.25,
        Math.random() * (0.5 - 0.25) + 0.25,
        Math.random() * (0.5 - 0.25) + 0.25
      ); // Adjust this to look like a chunk
      const chunkMaterial = new THREE.MeshStandardMaterial({
        color: originalColor,
        envMapIntensity: this.rareSpawn ? 1 : 0,
        emissive: originalColor,
        emissiveIntensity: this.rareSpawn ? 1 : 0,
      });

      const fragment = new THREE.Mesh(chunkGeometry, chunkMaterial);
      fragment.position.copy(originalPosition);
      this.scene.add(fragment);

      // Apply random velocity for realistic crumble motion
      let velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5, // Small outward push
        Math.random() * 0.5, // Slight upward motion
        (Math.random() - 0.5) * 0.5
      );

      let rotationVelocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      );

      let gravity = new THREE.Vector3(0, -0.02, 0); // Gravity pull
      const duration = 2000; // 2 seconds for the crumble animation
      const startTime = performance.now();

      // Animate the fragment
      const animateFragment = () => {
        const elapsed = performance.now() - startTime;
        const t = elapsed / duration;

        if (t >= 1) {
          this.scene.remove(fragment);
          return;
        }

        // Apply gravity
        velocity.add(gravity);
        velocity.multiplyScalar(0.98); // Friction (slows down over time)

        // Move the fragment
        fragment.position.add(velocity.clone().multiplyScalar(0.2));

        // Check if fragment has hit the ground
        if (fragment.position.y <= groundLevel) {
          fragment.position.y = groundLevel; // Ensure it doesn't go below ground
          velocity.set(0, 0, 0); // Stop vertical movement
        }

        // Rotate slightly as it falls
        fragment.rotation.x += rotationVelocity.x;
        fragment.rotation.y += rotationVelocity.y;
        fragment.rotation.z += rotationVelocity.z;

        // Fade out and shrink over time
        fragment.material.opacity = 1 - t;
        fragment.scale.setScalar(1 - t * 0.5);

        requestAnimationFrame(animateFragment);
      };

      animateFragment();
    }
  }

  update(deltaTime) {
    if (this.stats.currentHealth <= 0) {
      this.explode();
      this.scene.remove(this.mesh);
      if (this.onDestroy) this.onDestroy(this);
      this.player.points += this.points;
      this.isDead = true;
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
      // console.log(`The enemy is ${distanceToPlayer} meters away`);

      this.lastLogTime = performance.now();
    }

    // **Apply velocity**
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    this.boundingBox.setFromObject(this.mesh);
  }
}
