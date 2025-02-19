import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { Player } from "./Player";
import { Enemy } from "./Enemy";
import { CollisionManager } from "./CollisionManager";
import { View } from "./View";
import { config } from "../js/config";
import { GameState } from "./GameState";
import { enemies } from "../js/variables/enemies";
import { generateEnemyPosition, generateUUID } from "../js/utility";
import { roundRequirements } from "../js/variables/roundRequirements";
import { playSound } from "./SoundManager";

export class Game {
  constructor() {
    this.state = new GameState({
      current: "loading",
      view: { name: "testLevel001" },
      config: { viewport: "window" },
    });
    this.loadingManager = new THREE.LoadingManager();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.view = new View(this.state, this.renderer, this.loadingManager);

    // Wait for the setup to complete
    this.view.setupPromise
      .then(() => {
        // Now that setup is complete, proceed with the rest of the initialization
        this.scene = this.view.scene;
        this.camera = this.view.mainCamera;
        // Get GPU info
        const gl = this.renderer.getContext();
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        this.graphicsCardInfo = {
          gpu: debugInfo
            ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
            : "Unknown GPU - your experience may be unreliable",
          vendor: debugInfo
            ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
            : "Unknown Vender - your experience may be unreliable",
        };

        this.renderer.setSize(config.viewportSize[this.state.viewport]);
        document.body.appendChild(this.renderer.domElement);

        //////////////////////////////////////////////////////////////////
        //  ----------------------  GAME CLASSES  --------------------  //
        //////////////////////////////////////////////////////////////////

        this.controls = new PointerLockControls(
          this.camera,
          this.renderer.domElement
        );
        this.collisionManager = new CollisionManager(this.scene);
        this.player = new Player(
          this.camera,
          this.scene,
          this.collisionManager
        );
        this.enemies = [];
        this.round = 0;

        this.animate = this.animate.bind(this);
        this.animate();

        this.backgroundMusic = null;
      })
      .catch((error) => {
        console.error("Error during setup:", error);
      });

    // Add loading screen overlay
    this.loadingScreen = this.createLoadingScreen();
    document.body.appendChild(this.loadingScreen);

    //////////////////////////////////////////////////////////////////
    //  --------------------- LOADING MANAGER  -------------------  //
    //////////////////////////////////////////////////////////////////

    this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
      this.state.current = "loading";
      // console.log(`Started loading: ${url}`);
    };

    this.loadingManager.onLoad = () => {
      console.log("Loading complete!");
      const loadingProgressElement =
        this.loadingScreen.querySelector(".progress");
      loadingProgressElement.innerHTML = ``;
      loadingProgressElement.innerHTML = `<div><h1 class="click-to-start">Click to Register</h1>
       <p class="registration">This may take a few moments depending on your hardware</p>
      <p class="gpu-data">GPU: ${this.graphicsCardInfo.gpu}</p>
      <p class="gpu-data">Vendor: ${this.graphicsCardInfo.vendor}</p>
      </div> `;

      this.state.current = "running";
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
    //  --------------------  EVENT LISTENERS  -------------------  //
    //////////////////////////////////////////////////////////////////

    const lockControls = () => {
      // document.body.style.backgroundColor = "green";
      if (this.state.current !== "loading" && !this.player.lockedControls) {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.player.lockedControls = true;
        const aimingReticle = document.getElementById("aimingReticle");

        // Show the hit marker for a short period (e.g., 0.2 seconds)
        if (aimingReticle.style.display === "none")
          aimingReticle.style.display = "block";
        if (!this.backgroundMusic) {
          console.log("Initializing background music");
          this.registerMusic();
        }
      }
      if (!this.controls.isLocked) {
        // console.log("LockControls finished execution at:", performance.now());
        // setTimeout(() => {
        //   console.log("Game still lagging? Checking at:", performance.now());
        // }, 1000); // Logs again after 1 second

        this.controls.lock();
      }
    };

    // Click to lock controls
    document.body.addEventListener("click", lockControls);

    // Mobile Click to lock controls
    // document.body.addEventListener("touchstart", lockControls, { once: true });

    // Window resize handling
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      }, 200); // Delay to prevent too many calls
    });
  }

  async registerMusic() {
    function loadAudio(src) {
      return new Promise((resolve, reject) => {
        const audio = new Audio(src);
        audio.oncanplaythrough = () => resolve(audio);
        audio.onerror = () =>
          reject(new Error(`Failed to load audio at ${src}`));
      });
    }

    [this.backgroundMusic] = await Promise.all([
      loadAudio(
        `/assets/audio/music/cryptaGlyph${Math.floor(
          Math.random() * 3 + 1
        )}.mp3`
      ),
    ]);

    this.backgroundMusic.volume = 0.25;
    this.backgroundMusic.loop = true;
    this.backgroundMusic.play().catch((error) => {
      console.error("Audio playback failed:", error);
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
    // Check if we need to spawn a new enemy (max enemies = this.round + 1)
    const activeEnemies = this.enemies.filter((e) => !e.isDead); // Only count alive enemies
    // console.log(
    //   "Active enemies: ",
    //   activeEnemies.length,
    //   " / ",
    //   this.enemies.length
    // );

    if (activeEnemies.length < this.round + 1) {
      // Get random enemy configuration
      const enemyConfig = {
        ...enemies[this.round][
          Math.floor(Math.random() * enemies[this.round].length)
        ],
        uuid: generateUUID(),
        position: generateEnemyPosition(),
      };

      // Create a new enemy and pass the onDestroy callback
      const enemy = new Enemy(this.scene, this.player, enemyConfig, (e) => {
        e.isDead = true; // Mark as dead

        // Find and remove the enemy from the enemies array
        const index = this.enemies.findIndex((obj) => obj.uuid === e.uuid);
        if (index !== -1) {
          // Remove the enemy from the array
          this.enemies.splice(index, 1);
          this.player.enemiesKilled[this.player.weapon.name] += 1;
          this.player.enemiesKilled.total += 1;
        }
      });

      // Add the newly created enemy to the enemies array
      this.enemies.push(enemy);
    }
  }

  gameOver() {
    if (!this.restartingGame) {
      this.restartingGame = true;
      console.log("game over");
      const gameOverScreen = document.getElementById("game-over");
      gameOverScreen.style.display = "block";

      setTimeout(() => {
        window.location.reload(); // This will reload the page
      }, 3000); // Delay before reload
    }
  }

  // Main animation loop
  animate() {
    const currentTime = performance.now(); // Get the current time in milliseconds
    const deltaTime = (currentTime - this.lastTime) / 1000; // Calculate the time difference in seconds
    this.lastTime = currentTime; // Store the current time for the next frame

    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);

    if (!this.controls.isLocked) {
      this.player.lockedControls = false;
    } else if (this.loadingScreen.style.display === "flex") {
      this.loadingScreen.style.display = "none";
      console.log("Hiding loading screen...");
    }

    if (this.player.lockedControls) {
      if (this.state.current !== "running") return;
      if (this.player.isDead) {
        console.log("Player is dead, stopping animation.");
        return this.gameOver();
      }

      if (this.player.enemiesKilled.total > roundRequirements[this.round]) {
        this.round += 1;
      }

      this.manageEnemies();
      this.enemies.forEach((enemy) => {
        enemy.update(deltaTime);
      });

      const projectileStart = performance.now();
      const hitEnemies = [];
      this.player.weapon.projectiles.forEach((proj) => {
        this.enemies.forEach((enemy) => {
          if (
            this.collisionManager.checkProjectileCollisionsWithRay(proj, enemy)
          ) {
            hitEnemies.push({ enemy, proj });
          }
        });
      });

      hitEnemies.forEach(({ enemy, proj }) => {
        enemy.takeDamage(this.player.weapon.damage);
        proj.onDestroy(proj);
        this.player.showHitMarker();
      });

      this.player.update(deltaTime); // Pass deltaTime to the player's update function
      this.renderer.render(this.scene, this.camera);
    }
  }
}
