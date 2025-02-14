import * as THREE from "three";
import { Flashlight } from "./Flashlight";
import { Weapon } from "./Weapon";

export class Player {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    this.velocity = new THREE.Vector3();
    this.speed = 0.1;
    this.acceleration = 0.1; // Acceleration for smooth movement
    this.gravity = 0.2; // Gravity force
    this.isOnGround = false;

    this.cameraHeight = 1.6; // Camera height above ground
    this.playerHeight = 1.8; // Full height of player (for collision detection)
    this.collisionOffset = 1; // Offset for collision detection (center of the player)

    // Directional flags for movement
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    this.bindKeys();
    this.createPlayerBoundingBox();

    // Position the player at ground level
    this.camera.position.set(0, this.cameraHeight, 0); // Start at a reasonable height, e.g., 1.5 meters above the floor

    // Create a flashlight (spotlight) in front of the player
    this.flashlight = new Flashlight(scene);

    this.weapon = new Weapon(scene, this);
  }

  createPlayerBoundingBox() {
    // Create a bounding box that represents the player in the world
    const playerGeometry = new THREE.CylinderGeometry(
      0.9,
      0.9,
      this.playerHeight,
      32
    ); // Change to a cylinder for collision detection
    this.playerMesh = new THREE.Mesh(playerGeometry);
    this.playerMesh.position.set(0, this.cameraHeight, 0); // Position the player mesh
    this.scene.add(this.playerMesh); // Add the player to the scene (for visualization purposes)
    this.playerBoundingBox = new THREE.Box3().setFromObject(this.playerMesh);
  }

  bindKeys() {
    document.addEventListener(
      "keydown",
      (event) => this.onKeyDown(event),
      false
    );
    document.addEventListener("keyup", (event) => this.onKeyUp(event), false);
  }

  onKeyDown(event) {
    switch (event.keyCode) {
      case 87: // W key
        this.moveForward = true;
        break;
      case 83: // S key
        this.moveBackward = true;
        break;
      case 65: // A key
        this.moveLeft = true;
        break;
      case 68: // D key
        this.moveRight = true;
        break;
    }
  }

  onKeyUp(event) {
    switch (event.keyCode) {
      case 87: // W key
        this.moveForward = false;
        break;
      case 83: // S key
        this.moveBackward = false;
        break;
      case 65: // A key
        this.moveLeft = false;
        break;
      case 68: // D key
        this.moveRight = false;
        break;
    }
  }

  // Check if the player is on the ground using raycasting
  checkGround() {
    const raycaster = new THREE.Raycaster(
      this.camera.position.clone(),
      new THREE.Vector3(0, -1, 0), // Ray pointing straight down
      0, // Don't need a specific minimum distance
      this.collisionOffset + 0.1 // Distance of 1 meter to check for ground
    );

    const intersects = raycaster.intersectObjects(this.scene.children, true);
    if (intersects.length > 0) {
      this.isOnGround = true;
      this.velocity.y = 0; // Reset vertical velocity when grounded
      if (this.camera.position.y > intersects[0].point.y + this.cameraHeight) {
        this.camera.position.y = intersects[0].point.y + this.cameraHeight;
      }
    } else {
      this.isOnGround = false;
    }
  }

  // Handle collision detection with walls
  checkCollisions() {
    // Update the player's bounding box position
    this.playerBoundingBox.setFromObject(this.playerMesh);

    // Check for collisions with all objects in the scene
    const objectsInScene = this.scene.children.filter(
      (object) => object.isWall === true
    );

    for (const object of objectsInScene) {
      if (object instanceof THREE.Mesh) {
        const objectBoundingBox = new THREE.Box3().setFromObject(object);
        if (this.playerBoundingBox.intersectsBox(objectBoundingBox)) {
          // Collision detected, handle the player's movement
          return true;
        }
      }
    }
    return false;
  }

  update(deltaTime) {
    // Store the current position before moving the player
    const prevPosition = this.camera.position.clone();

    // Check for ground detection
    this.checkGround();

    // Get camera direction and right vectors (XZ plane only)
    const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(
      this.camera.quaternion
    );
    const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(
      this.camera.quaternion
    );

    // Ensure the player only moves in the XZ plane (ignore vertical movement)
    cameraDirection.y = 0;
    cameraRight.y = 0;
    cameraDirection.normalize();
    cameraRight.normalize();

    const targetVelocity = new THREE.Vector3(0, 0, 0);

    // Handle movement based on keys (WASD)
    if (this.moveForward) {
      targetVelocity.add(cameraDirection.multiplyScalar(this.speed)); // Move forward relative to camera
    }
    if (this.moveBackward) {
      targetVelocity.add(cameraDirection.multiplyScalar(-this.speed)); // Move backward relative to camera
    }
    if (this.moveLeft) {
      targetVelocity.add(cameraRight.multiplyScalar(-this.speed)); // Move left relative to camera
    }
    if (this.moveRight) {
      targetVelocity.add(cameraRight.multiplyScalar(this.speed)); // Move right relative to camera
    }

    // Apply acceleration and deceleration
    this.velocity.x =
      this.velocity.x +
      (targetVelocity.x - this.velocity.x) * this.acceleration;
    this.velocity.z =
      this.velocity.z +
      (targetVelocity.z - this.velocity.z) * this.acceleration;

    // Apply gravity when the player is not on the ground
    if (!this.isOnGround) {
      this.velocity.y -= this.gravity; // Apply gravity
    }

    // Move player based on velocity and update camera position
    this.camera.position.add(this.velocity);

    // Move the player mesh (bounding box object) to match the camera position
    this.playerMesh.position.copy(this.camera.position);

    // Update the bounding box to match the player mesh's new position
    this.playerBoundingBox.setFromObject(this.playerMesh);

    // Check for wall collisions after moving
    if (this.checkCollisions()) {
      // If there's a collision, revert the movement
      this.camera.position.copy(prevPosition);
      this.playerMesh.position.copy(prevPosition); // Revert player mesh position as well
      this.playerBoundingBox.setFromObject(this.playerMesh); // Ensure bounding box also reverts
    }

    this.flashlight.update(this.camera);

    this.weapon.update(deltaTime);
  }
}
