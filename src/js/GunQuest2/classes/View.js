import * as THREE from "three";
import { Level } from "./Level";

export class View {
  constructor(state, renderer, loadingManager) {
    this.state = state.current;
    this.renderer = renderer;
    this.name = state.view.name;
    this.loadingManager = loadingManager;
    this.scene = new THREE.Scene();

    // Store lights and cameras
    this.lights = [];

    // Setup promise to ensure full setup before Game.js continues
    this.setupPromise = this.initializeViewConfig(this.name);
  }

  async initializeViewConfig(filename) {
    try {
      this.viewConfig = await this.generateConfig(filename);
      if (!this.viewConfig) {
        throw new Error("Failed to load view configuration");
      }

      // Load level first before proceeding
      this.level = new Level(
        this.scene,
        this.renderer,
        this.loadingManager,
        this.viewConfig.level
      );
      await this.level.load(); // Ensure level is fully loaded

      this.setUpLights(this.viewConfig.lights);
      this.setUpCameras(this.viewConfig.cameras);
    } catch (error) {
      console.error("Error in initializing view:", error);
    }
  }

  async generateConfig(filename) {
    console.log("Loading configuration for:", filename);
    const configPath = `/assets/levels/${filename}.json`;

    try {
      const response = await fetch(configPath);
      if (!response.ok)
        throw new Error(`Failed to fetch config: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error("Error loading configuration:", error);
      return null;
    }
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
    lights.forEach((lightConfig) => {
      const light = new THREE[lightConfig.type](
        lightConfig.color,
        lightConfig.intensity
      );
      if (lightConfig.position) {
        light.position.set(
          lightConfig.position.x,
          lightConfig.position.y,
          lightConfig.position.z
        );
      }
      this.scene.add(light);
      this.lights.push(light);
    });
  }

  update() {
    console.log("updating");
  }
}
