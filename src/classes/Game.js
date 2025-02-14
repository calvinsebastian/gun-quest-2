import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { Player } from "./Player";
import { Level } from "./Level";

export class Game {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(25, 25, 25);
    this.camera.lookAt(0, 5, 0);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // Add loading screen overlay
    this.loadingScreen = this.createLoadingScreen();
    document.body.appendChild(this.loadingScreen);

    // Loading Manager to track loading progress
    this.loadingManager = new THREE.LoadingManager();

    this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
      console.log(`Started loading: ${url}`);
    };

    // When all assets are loaded, we hide the loading screen and start the game
    this.loadingManager.onLoad = () => {
      console.log("Loading complete!");
      this.loadingScreen.style.display = "none"; // Hide loading screen
      this.isLoading = false; // Mark as not loading
    };

    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progress = (itemsLoaded / itemsTotal) * 100;
      this.loadingScreen.querySelector(
        ".progress"
      ).textContent = `Loading... ${Math.round(progress)}%`;
    };

    this.loadingManager.onError = (url) => {
      console.error(`Error loading: ${url}`);
    };

    // Instantiate player and level
    this.player = new Player(this.camera, this.scene);
    this.level = new Level(this.scene, this.loadingManager); // Pass loadingManager to Level

    // PointerLockControls for camera control
    this.controls = new PointerLockControls(
      this.camera,
      this.renderer.domElement
    );

    // Lock pointer on click, only after assets have loaded
    document.body.addEventListener("click", () => {
      if (!this.isLoading) {
        this.controls.lock();
        this.enablePlayerInput();
      }
    });

    this.isLoading = true; // Set loading flag to true while assets load
    this.animate = this.animate.bind(this);
    this.animate();

    // Window resize handling
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // Create the loading screen
  createLoadingScreen() {
    const loadingScreen = document.createElement("div");
    loadingScreen.style.position = "absolute";
    loadingScreen.style.top = "0";
    loadingScreen.style.left = "0";
    loadingScreen.style.width = "100%";
    loadingScreen.style.height = "100%";
    loadingScreen.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    loadingScreen.style.color = "white";
    loadingScreen.style.display = "flex";
    loadingScreen.style.flexDirection = "column";
    loadingScreen.style.alignItems = "center";
    loadingScreen.style.justifyContent = "center";
    loadingScreen.style.fontSize = "24px";

    const progress = document.createElement("div");
    progress.className = "progress";
    progress.textContent = "Loading... 0%";
    loadingScreen.appendChild(progress);

    return loadingScreen;
  }

  // Enable player input
  enablePlayerInput() {
    this.isLoading = false; // Disable loading flag
  }

  // Main animation loop
  animate() {
    const currentTime = performance.now(); // Get the current time in milliseconds
    const deltaTime = (currentTime - this.lastTime) / 1000; // Calculate the time difference in seconds
    this.lastTime = currentTime; // Store the current time for the next frame

    requestAnimationFrame(this.animate);

    if (!this.isLoading) {
      this.player.update(deltaTime); // Pass deltaTime to the player's update function
      this.level.update(deltaTime); // Pass deltaTime to the level's update function

      // Update light position based on player direction
      this.renderer.render(this.scene, this.camera);
    }
  }
}
