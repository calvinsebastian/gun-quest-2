import * as THREE from "three";
import { Flashlight } from "./Flashlight";
import { Weapon } from "./Weapon";

export class Player {
  constructor(camera, scene, collisionManager) {
    this.camera = camera;
    this.scene = scene;
    this.collisionManager = collisionManager;
    this.velocity = new THREE.Vector3();
    this.speed = 0.1;
    this.acceleration = 0.1; // Acceleration for smooth movement
    this.gravity = 0.2; // Gravity force
    this.isOnGround = false;
    this.lockedControls = false; // Prevent player input

    this.cameraHeight = 1.6; // Camera height above ground
    this.playerHeight = 1.8; // Full height of player (for collision detection)
    this.collisionOffset = 1; // Offset for collision detection (center of the player)

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    this.bindKeys();
    this.createBoundingBox();

    this.camera.position.set(0, this.cameraHeight, 0); // Position the player at ground level
    this.flashlight = new Flashlight(scene);
    this.weapon = new Weapon(scene, this);

    this.enemiesKilled = { pistol: 0, total: 0 };
  }

  createBoundingBox() {
    // Create a bounding box that represents the player in the world
    const playerGeometry = new THREE.BoxGeometry(1, this.playerHeight, 1);
    this.playerMesh = new THREE.Mesh(playerGeometry);
    this.playerMesh.position.set(0, this.cameraHeight, 0); // Position the player mesh
    this.scene.add(this.playerMesh); // Add the player to the scene (for visualization purposes)
    this.boundingBox = new THREE.Box3().setFromObject(this.playerMesh);
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

  update(deltaTime) {
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

    cameraDirection.y = 0;
    cameraRight.y = 0;
    cameraDirection.normalize();
    cameraRight.normalize();

    const targetVelocity = new THREE.Vector3(0, 0, 0);

    if (this.moveForward)
      targetVelocity.add(cameraDirection.multiplyScalar(this.speed));
    if (this.moveBackward)
      targetVelocity.add(cameraDirection.multiplyScalar(-this.speed));
    if (this.moveLeft)
      targetVelocity.add(cameraRight.multiplyScalar(-this.speed));
    if (this.moveRight)
      targetVelocity.add(cameraRight.multiplyScalar(this.speed));

    this.velocity.x =
      this.velocity.x +
      (targetVelocity.x - this.velocity.x) * this.acceleration;
    this.velocity.z =
      this.velocity.z +
      (targetVelocity.z - this.velocity.z) * this.acceleration;

    if (!this.isOnGround) {
      this.velocity.y -= this.gravity;
    }

    // Move player based on velocity and update camera position
    this.camera.position.add(this.velocity);
    this.playerMesh.position.copy(this.camera.position);
    this.boundingBox.setFromObject(this.playerMesh);

    // Check for static collisions using CollisionManager
    if (this.collisionManager.checkStaticCollisions(this)) {
      this.camera.position.copy(prevPosition); // Prevent moving if collision detected
      this.playerMesh.position.copy(prevPosition);
      this.boundingBox.setFromObject(this.playerMesh);
    }

    this.flashlight.update(this.camera);
    this.weapon.update(deltaTime);
  }
}
