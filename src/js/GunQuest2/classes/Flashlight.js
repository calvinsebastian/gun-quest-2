import * as THREE from "three";

export class Flashlight {
  constructor(scene) {
    this.scene = scene;
    this.lightSource = new THREE.SpotLight(0xffffee, 15); // Main spotlight
    this.secondaryLightSource = new THREE.SpotLight(0xffffdd, 5); // Secondary light (dimmer)

    // Set initial positions
    this.lightSource.position.set(0, 1.2, 0);
    this.secondaryLightSource.position.set(0, 1.2, 0);

    // Main light setup
    this.lightSource.penumbra = 1;
    this.lightSource.distance = 40;
    this.lightSource.angle = Math.PI / 20;
    this.lightSource.castShadow = true; // Enable shadows for the main light

    // Secondary light setup
    this.secondaryLightSource.penumbra = 1; // Softer penumbra for the secondary light
    this.secondaryLightSource.distance = 15; // Larger radius for the secondary light
    this.secondaryLightSource.angle = Math.PI / 5;
    this.secondaryLightSource.castShadow = false; // Secondary light doesn't need shadows

    // Add both lights to the scene
    this.scene.add(this.lightSource);
    this.scene.add(this.secondaryLightSource);
  }

  update(camera) {
    const playerDirection = camera.getWorldDirection(new THREE.Vector3());

    // Position the lights in front of the camera
    const lightOffset = 0.5; // Controls how far the light is in front of the camera
    this.lightSource.position
      .copy(camera.position)
      .add(playerDirection.multiplyScalar(lightOffset));

    // Secondary light is a bit further behind and fades out
    const secondaryOffset = 1.5; // Secondary light has a larger offset
    this.secondaryLightSource.position
      .copy(camera.position)
      .add(playerDirection.multiplyScalar(secondaryOffset));

    // Light targets: Main light focuses on a target close to the camera (bright)
    this.lightSource.target.position
      .copy(camera.position)
      .add(playerDirection.multiplyScalar(10)); // Close target (bright area)
    this.secondaryLightSource.target.position
      .copy(camera.position)
      .add(playerDirection.multiplyScalar(20)); // Far target (faded area)

    // Update matrices for the targets
    this.lightSource.target.updateMatrixWorld();
    this.secondaryLightSource.target.updateMatrixWorld();
  }
}
