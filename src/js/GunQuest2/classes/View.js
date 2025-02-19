import * as THREE from "three";
import { Level } from "./Level";

export class View {
  constructor(state, loadingManager) {
    this.state = state.current;
    this.name = state.view.name;

    // Return a promise that resolves when setup is complete
    this.setupPromise = this.initializeViewConfig(this.name, loadingManager);
  }

  async initializeViewConfig(filename, loadingManager) {
    try {
      this.viewConfig = await this.generateConfig(filename);
      if (!this.viewConfig) {
        throw new Error("Failed to load view configuration");
      }

      // Proceed with the rest of the setup once config is loaded
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
    } catch (error) {
      console.error("Error in initializing view:", error);
    }
  }

  async generateConfig(filename) {
    console.log("Loading configuration for:", filename);

    // Define the path to your level config JSON
    const configPath = `/assets/levels/${filename}.json`;

    // Fetch the configuration file
    try {
      const response = await fetch(configPath);
      const configData = await response.json();

      if (!configData) {
        throw new Error(`No configuration found for ${filename}`);
      }
      return configData;
    } catch (error) {
      console.error("Error loading configuration:", error);
      return null; // Or handle with a default/fallback config
    }
  }

  setUpScene() {
    console.log("setting up scene", this.viewConfig);
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

  update() {
    console.log("updating");
  }
}
