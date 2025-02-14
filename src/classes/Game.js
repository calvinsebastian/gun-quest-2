import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { Player } from "./Player";
import { Level } from "./Level";
import { Enemy } from "./Enemy";
import { CollisionManager } from "./CollisionManager";

export class Game {
  constructor() {
    //////////////////////////////////////////////////////////////////
    //  ----------------------  SCENE SETUP  ---------------------  //
    //////////////////////////////////////////////////////////////////

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
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    // Add loading screen overlay
    this.loadingScreen = this.createLoadingScreen();
    document.body.appendChild(this.loadingScreen);

    //////////////////////////////////////////////////////////////////
    //  --------------------- LOADING MANAGER  -------------------  //
    //////////////////////////////////////////////////////////////////

    this.loadingManager = new THREE.LoadingManager();

    this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
      console.log(`Started loading: ${url}`);
    };

    this.loadingManager.onLoad = () => {
      setTimeout(() => {
        console.log("Loading complete!");
        this.loadingScreen.innerHTML = ``;
        this.loadingScreen.innerHTML = `<button id="start-button">Start</button>`;
        const startButton = document.getElementById("start-button");

        startButton.addEventListener("click", () => {
          if (!this.isLoading) {
            console.log("clicked");
            this.hideLoadingScreen();
            this.controls.lock();
            this.enablePlayerInput();
            this.player.lockedControls = false;
          }
        });
        this.isLoading = false;
      }, 4000);
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

    //////////////////////////////////////////////////////////////////
    //  -------------------  COLLISION MANAGER  ------------------  //
    //////////////////////////////////////////////////////////////////

    this.collisionManager = new CollisionManager(this.scene);

    //////////////////////////////////////////////////////////////////
    //  --------------------  EVENT LISTENERS  -------------------  //
    //////////////////////////////////////////////////////////////////

    document.body.addEventListener("click", () => {
      if (!this.player.lockedControls) {
        this.hideLoadingScreen();
        this.controls.lock();
        this.enablePlayerInput();
        this.player.lockedControls = false;
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
    this.level = new Level(this.scene, this.loadingManager);
    this.enemies = [];

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

  // Enable player input
  enablePlayerInput() {
    this.isLoading = false; // Disable loading flag
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

    if (!this.isLoading && !this.player.lockedControls) {
      this.manageEnemies();

      this.enemies.forEach((enemy) => {
        enemy.update(deltaTime);

        if (this.collisionManager.checkEnemyCollisions(enemy, this.player)) {
          console.log("Enemy collided with player!");
        }
      });

      this.player.update(deltaTime); // Pass deltaTime to the player's update function
      this.level.update(deltaTime); // Pass deltaTime to the level's update function

      // Update light position based on player direction
      this.renderer.render(this.scene, this.camera);
    }
  }
}
