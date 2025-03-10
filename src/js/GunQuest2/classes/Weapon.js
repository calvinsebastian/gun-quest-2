// import * as THREE from "three";
// import { Projectile } from "./Projectile.js";
// import { playSound } from "./SoundManager.js";

// export class Weapon {
//   constructor(scene, player) {
//     this.scene = scene;
//     this.player = player;
//     this.name = "pistol";
//     this.weaponMesh = this.createWeaponMesh();
//     this.scene.add(this.weaponMesh);
//     this.damage = 3;

//     this.projectiles = [];

//     // Listen for mouse click to shoot
//     window.addEventListener("mousedown", () => {
//       if (this.player.lockedControls) this.shoot();
//     });
//   }

//   // Create the weapon mesh (a simple gun using box geometries)
//   createWeaponMesh() {
//     // Materials for the gun parts
//     const handleMaterial = new THREE.MeshStandardMaterial({
//       color: 0x121212, // Dark grey/black
//       metalness: 0.5, // Makes it partially metallic (higher = shinier)
//       roughness: 0.4, // Controls the roughness of the material (lower = shinier)
//     });

//     const barrelMaterial = new THREE.MeshStandardMaterial({
//       color: 0x121212, // Dark grey/black
//       metalness: 0.5, // Partially metallic
//       roughness: 0.4, // Smooth but not perfectly shiny
//     });

//     const bodyMaterial = new THREE.MeshStandardMaterial({
//       color: 0x050505, // Dark grey/black
//       metalness: 0.5, // Partially metallic
//       roughness: 0.4, // Smooth surface
//     });

//     // Handle of the gun (Rectangular prism)
//     const handleGeometry = new THREE.CylinderGeometry(0.03, 0.035, 0.15, 16); // Scaled by 50%
//     const handleMesh = new THREE.Mesh(handleGeometry, handleMaterial);
//     handleMesh.position.set(0, -0.06, 0); // Adjust position relative to the camera
//     handleMesh.rotateX(2.6);

//     // Barrel of the gun (Long rectangular prism)
//     const barrelGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.5, 16); // Scaled by 50%
//     const barrelMesh = new THREE.Mesh(barrelGeometry, barrelMaterial);
//     barrelMesh.position.set(0, 0, -0.3); // Adjust position relative to the handle
//     barrelMesh.rotateX(1.55);

//     // Body of the gun (Main part of the gun)
//     const bodyGeometry = new THREE.CylinderGeometry(0.04, 0.038, 0.2, 155); // Scaled by 50%
//     const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
//     bodyMesh.position.set(0, -0.009, -0.1); // Adjust position relative to the handle
//     bodyMesh.rotateX(1.55);

//     // Create a group to combine the parts (handle, body, barrel)
//     const weaponGroup = new THREE.Group();
//     weaponGroup.add(handleMesh);
//     weaponGroup.add(barrelMesh);
//     weaponGroup.add(bodyMesh);
//     return weaponGroup;
//   }

//   shoot() {
//     playSound("/assets/audio/effects/gunshot1.wav", 0.5);
//     // Get the position and direction of the shot
//     const direction = this.player.camera.getWorldDirection(new THREE.Vector3());
//     const position = this.weaponMesh.position
//       .clone()
//       .add(direction.multiplyScalar(0.5)); // Fire from the barrel
//     const flash = this.player.camera.position
//       .clone()
//       .add(direction.multiplyScalar(1)); // Fire from the barrel

//     // Adjust the position to be 5 units in front of the muzzle
//     const adjustedPosition = flash.add(direction.clone().multiplyScalar(3));

//     // Create a new projectile and add it to the scene
//     const projectile = new Projectile(this.scene, position, direction, (p) => {
//       // Remove the projectile from the array when it's destroyed
//       const index = this.projectiles.indexOf(p);
//       if (index !== -1) {
//         this.projectiles.splice(index, 1);
//       }
//     });

//     this.projectiles.push(projectile);

//     // Create the muzzle flash light
//     const muzzleFlash = new THREE.PointLight(0xffffaa, 2, 10, 2); // White light, intensity of 10, distance of 5, and decay of 2
//     muzzleFlash.distance = 20;
//     muzzleFlash.angle = Math.PI / 5;
//     muzzleFlash.castShadow = true; // Enable shadows if necessary
//     muzzleFlash.position.copy(adjustedPosition); // Position it at the gun's muzzle (weapon barrel)
//     this.scene.add(muzzleFlash);

//     // Animate the muzzle flash to fade out quickly
//     setTimeout(() => {
//       this.scene.remove(muzzleFlash); // Remove the muzzle flash from the scene after 0.1 seconds
//     }, 15); // Fade out after 100ms
//   }

//   // Update the weapon's position based on the camera
//   update(deltaTime) {
//     const playerDirection = this.player.camera.getWorldDirection(
//       new THREE.Vector3()
//     );

//     const cameraRight = new THREE.Vector3(1, -0.4, 0).applyQuaternion(
//       this.player.camera.quaternion
//     );

//     // Position the weapon slightly to the right of the player
//     this.weaponMesh.position
//       .copy(this.player.camera.position)
//       .add(playerDirection.multiplyScalar(0.25))
//       .add(cameraRight.multiplyScalar(0.12));

//     this.weaponMesh.rotation.copy(this.player.camera.rotation);

//     this.projectiles.forEach((projectile) => projectile.update(deltaTime));
//   }
// }

import * as THREE from "three";
import { Projectile } from "./Projectile.js";
import { playSound } from "./SoundManager.js";

export class Weapon {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.name = "pistol";
    this.weaponMesh = this.createWeaponMesh();
    this.scene.add(this.weaponMesh);
    this.damage = 3;

    this.projectiles = [];

    // Create the muzzle flash light once and add it to the scene

    this.muzzleFlash = new THREE.PointLight(0xffffaa, 2, 10, 2);
    this.muzzleFlash.distance = 20;
    this.muzzleFlash.angle = Math.PI / 5;
    this.muzzleFlash.castShadow = true;
    this.scene.add(this.muzzleFlash);
    this.muzzleFlash.visible = false; // Initially not visible

    // Listen for mouse click to shoot
    window.addEventListener("mousedown", () => {
      if (this.player.lockedControls) this.shoot();
    });
  }

  // Create the weapon mesh (a simple gun using box geometries)
  createWeaponMesh() {
    // Materials for the gun parts
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0x121212, // Dark grey/black
      metalness: 0.5, // Makes it partially metallic (higher = shinier)
      roughness: 0.4, // Controls the roughness of the material (lower = shinier)
    });

    const barrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x121212, // Dark grey/black
      metalness: 0.5, // Partially metallic
      roughness: 0.4, // Smooth but not perfectly shiny
    });

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x050505, // Dark grey/black
      metalness: 0.5, // Partially metallic
      roughness: 0.4, // Smooth surface
    });

    // Handle of the gun (Rectangular prism)
    const handleGeometry = new THREE.CylinderGeometry(0.03, 0.035, 0.15, 16); // Scaled by 50%
    const handleMesh = new THREE.Mesh(handleGeometry, handleMaterial);
    handleMesh.position.set(0, -0.06, 0); // Adjust position relative to the camera
    handleMesh.rotateX(2.6);

    // Barrel of the gun (Long rectangular prism)
    const barrelGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.5, 16); // Scaled by 50%
    const barrelMesh = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrelMesh.position.set(0, 0, -0.3); // Adjust position relative to the handle
    barrelMesh.rotateX(1.55);

    // Body of the gun (Main part of the gun)
    const bodyGeometry = new THREE.CylinderGeometry(0.04, 0.038, 0.2, 155); // Scaled by 50%
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.set(0, -0.009, -0.1); // Adjust position relative to the handle
    bodyMesh.rotateX(1.55);

    // Create a group to combine the parts (handle, body, barrel)
    const weaponGroup = new THREE.Group();
    weaponGroup.add(handleMesh);
    weaponGroup.add(barrelMesh);
    weaponGroup.add(bodyMesh);
    return weaponGroup;
  }

  shoot() {
    playSound("/assets/audio/effects/gunshot1.wav", 0.5);
    // Get the position and direction of the shot
    const direction = this.player.camera.getWorldDirection(new THREE.Vector3());
    const position = this.weaponMesh.position
      .clone()
      .add(direction.multiplyScalar(0.5)); // Fire from the barrel

    // Adjust the position to be 5 units in front of the muzzle
    const adjustedPosition = position.clone().add(direction.multiplyScalar(5));

    // Create a new projectile and add it to the scene
    const projectile = new Projectile(this.scene, position, direction, (p) => {
      // Remove the projectile from the array when it's destroyed
      const index = this.projectiles.indexOf(p);
      if (index !== -1) {
        this.projectiles.splice(index, 1);
      }
    });

    this.projectiles.push(projectile);

    // Turn on the muzzle flash by setting its position and making it visible
    this.muzzleFlash.position.copy(adjustedPosition);
    this.muzzleFlash.visible = true;

    // Animate the muzzle flash to fade out quickly
    setTimeout(() => {
      this.muzzleFlash.visible = false; // Turn off the muzzle flash after 100ms
    }, 50); // Fade out after 100ms
  }

  // Update the weapon's position based on the camera
  update(deltaTime) {
    const playerDirection = this.player.camera.getWorldDirection(
      new THREE.Vector3()
    );

    const cameraRight = new THREE.Vector3(1, -0.4, 0).applyQuaternion(
      this.player.camera.quaternion
    );

    // Position the weapon slightly to the right of the player
    this.weaponMesh.position
      .copy(this.player.camera.position)
      .add(playerDirection.multiplyScalar(0.25))
      .add(cameraRight.multiplyScalar(0.12));

    this.weaponMesh.rotation.copy(this.player.camera.rotation);

    this.projectiles.forEach((projectile) => projectile.update(deltaTime));
  }
}
