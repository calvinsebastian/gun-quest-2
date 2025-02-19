import * as THREE from "three";

export class Flashlight {
  constructor(scene) {
    this.scene = scene;
    this.lightSource = new THREE.SpotLight(0xffffff, 3); // Directional light
    this.lightSource.position.set(0, 1.2, 0); // Initial position of the light
    this.lightSource.penumbra = 1;
    this.lightSource.distance = 20;
    this.lightSource.angle = Math.PI / 5;
    this.lightSource.castShadow = true; // Enable shadows if necessary
    this.scene.add(this.lightSource);
  }

  update(camera) {
    const playerDirection = camera.getWorldDirection(new THREE.Vector3());

    this.lightSource.position
      .copy(camera.position)
      .add(playerDirection.multiplyScalar(0.1));

    this.lightSource.target.position
      .copy(camera.position)
      .add(playerDirection.multiplyScalar(10));

    this.lightSource.target.updateMatrixWorld();
  }
}
