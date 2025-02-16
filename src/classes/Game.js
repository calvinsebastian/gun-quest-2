import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { Player } from "./Player";
import { Enemy } from "./Enemy";
import { CollisionManager } from "./CollisionManager";
import { View } from "./View";
import { config } from "../variables/config";
import { GameState } from "./GameState";

export class Game {
  constructor() {
    this.state = new GameState({
      current: "loading",
      view: { name: "test" },
      config: { viewport: "window" },
    });
    this.loadingManager = new THREE.LoadingManager();
    this.view = new View(this.state, this.loadingManager);
    this.scene = this.view.scene;
    this.camera = this.view.mainCamera;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    // Get GPU info
    const gl = this.renderer.getContext();
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    let graphicsCardInfo = {
      gpu: debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : "Unknown GPU - your experience may be unreliable",
      vendor: debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        : "Unknown Vender - your experience may be unreliable",
    };

    this.renderer.setSize(config.viewportSize[this.state.viewport]);
    document.body.appendChild(this.renderer.domElement);

    // Add loading screen overlay
    this.loadingScreen = this.createLoadingScreen();
    document.body.appendChild(this.loadingScreen);

    //////////////////////////////////////////////////////////////////
    //  --------------------- LOADING MANAGER  -------------------  //
    //////////////////////////////////////////////////////////////////

    this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
      this.state.current = "loading";
      console.log(`Started loading: ${url}`);
    };

    this.loadingManager.onLoad = () => {
      console.log("Loading complete!");
      const loadingProgressElement =
        this.loadingScreen.querySelector(".progress");
      loadingProgressElement.innerHTML = ``;
      loadingProgressElement.innerHTML = `<div><h1>Click the screen to start</h1><p class="registration">Registering Hardware . . .</p>
      <p class="gpu-data">GPU: ${graphicsCardInfo.gpu}</p>
      <p class="gpu-data">Vendor: ${graphicsCardInfo.vendor}</p>
      </div> `;
      this.state.current = "running";
    };

    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progress = (itemsLoaded / itemsTotal) * 100;

      console.log("progressing", progress);

      this.loadingScreen.querySelector(
        ".progress"
      ).textContent = `Loading... ${Math.round(progress)}%`;
    };

    this.loadingManager.onError = (url) => {
      console.error(`Error loading: ${url}`);
    };

    //////////////////////////////////////////////////////////////////
    //  -------------------  COLLISION MANAGER  ------------------  //
    //////////////////////////////////////////////////////////////////

    this.collisionManager = new CollisionManager(this.scene);

    //////////////////////////////////////////////////////////////////
    //  --------------------  EVENT LISTENERS  -------------------  //
    //////////////////////////////////////////////////////////////////

    document.body.addEventListener("click", () => {
      if (this.state.current !== "loading") {
        console.log("clicked to start");
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.hideLoadingScreen();
        this.controls.lock();
        this.player.lockedControls = true;
      }
    });

    //////////////////////////////////////////////////////////////////
    //  ----------------------  GAME CLASSES  --------------------  //
    //////////////////////////////////////////////////////////////////

    this.controls = new PointerLockControls(
      this.camera,
      this.renderer.domElement
    );
    this.player = new Player(this.camera, this.scene, this.collisionManager);
    this.enemies = [];

    this.animate = this.animate.bind(this);
    this.animate();

    // Window resize handling
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  hideLoadingScreen() {
    this.loadingScreen.style.display = "none"; // Hide loading screen
  }

  // Create the loading screen
  createLoadingScreen() {
    const loadingScreen = document.createElement("div");
    loadingScreen.style.position = "absolute";
    loadingScreen.style.top = "0";
    loadingScreen.style.left = "0";
    loadingScreen.style.width = "100%";
    loadingScreen.style.height = "100%";
    loadingScreen.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
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

  manageEnemies() {
    if (this.enemies.length < 1) {
      console.log("adding an enemy");
      const enemy = new Enemy(this.scene, this.player, 3);
      this.enemies.push(enemy);
    }
  }

  // Main animation loop
  animate() {
    const currentTime = performance.now(); // Get the current time in milliseconds
    const deltaTime = (currentTime - this.lastTime) / 1000; // Calculate the time difference in seconds
    this.lastTime = currentTime; // Store the current time for the next frame

    requestAnimationFrame(this.animate);

    if (this.player.lockedControls && this.state.current === "running") {
      this.manageEnemies();

      this.enemies.forEach((enemy) => {
        enemy.update(deltaTime);

        if (this.collisionManager.checkEnemyCollisions(enemy, this.player)) {
          console.log("Enemy collided with player!");
        }
      });

      this.player.update(deltaTime); // Pass deltaTime to the player's update function
      // Update light position based on player direction
      this.view.update(deltaTime);
      this.renderer.render(this.scene, this.camera);
    }
  }
}
