import * as THREE from "three";
import { views } from "../variables/views";
import { Level } from "./Level";

export class View {
  constructor(state, loadingManager) {
    this.state = state.current;
    this.name = state.view.name;
    this.viewConfig = views[this.name];
    this.scene = new THREE.Scene();
    this.loadingManager = loadingManager;
    this.lights = this.viewConfig.lights;
    this.cameras = this.viewConfig.cameras;
    this.level = new Level(
      this.scene,
      this.loadingManager,
      this.viewConfig.level
    );

    //////////////////////////////////////////////////////////////////
    //  ----------------------  SCENE SETUP  ---------------------  //
    //////////////////////////////////////////////////////////////////

    this.setUpScene();
  }

  setUpScene() {
    console.log("setting up scene");
    this.level.load();
    this.setUpLights(this.lights);
    this.setUpCameras(this.cameras);
  }

  setUpCameras(cameras) {
    cameras.forEach((camera) => {
      this[camera.label] = new THREE[camera.type](
        camera.fov,
        camera.aspect,
        camera.near,
        camera.far
      );
      this[camera.label].position.set(
        camera.position.x,
        camera.position.y,
        camera.position.z
      );
      this[camera.label].lookAt(
        camera.focusPoint.x,
        camera.focusPoint.y,
        camera.focusPoint.z
      );
      this.scene.add(this[camera.label]);
    });
  }

  setUpLights(lights) {
    lights.forEach((light) => {
      this[light.label] = new THREE[light.type](light.color, light.intensity);
      if (light.position) {
        this[light.label].position.set(
          light.position.x,
          light.position.y,
          light.position.z
        );
      }
      this.scene.add(this[light.label]);
    });
  }
}
