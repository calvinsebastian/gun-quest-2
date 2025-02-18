import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { Player } from "./Player";
import { Enemy } from "./Enemy";
import { CollisionManager } from "./CollisionManager";
import { View } from "./View";
import { config } from "../variables/config";
import { GameState } from "./GameState";
import { enemies } from "../variables/enemies";
import { generateEnemyPosition, generateUUID } from "../utility";
import { roundRequirements } from "../variables/roundRequirements";

export class Game {
  constructor() {
    this.state = new GameState({
      current: "loading",
      view: { name: "testLevel001" },
      config: { viewport: "window" },
    });
    this.loadingManager = new THREE.LoadingManager();
    this.view = new View(this.state, this.loadingManager);

    // Wait for the setup to complete
    this.view.setupPromise
      .then(() => {
        // Now that setup is complete, proceed with the rest of the initialization
        this.scene = this.view.scene;
        this.camera = this.view.mainCamera;
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
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
       <p class="registration">This may take few moments depending on your hardware</p>
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
      if (this.state.current !== "loading") {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.controls.lock();
        this.player.lockedControls = true;
        if (!this.backgroundMusic) this.registerMusic();
      } else {
        console.log("unsuccessful click to start");
      }
    };

    // Click to lock controls
    document.body.addEventListener("click", lockControls);

    // Click to lock controls
    document.body.addEventListener("touchstart", lockControls, { once: true });

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
      loadAudio("/audio/assets/music/cryptaGlyph3.mp3"),
    ]);
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
    console.log("Current number of enemies:", this.enemies.length);

    // Check if we need to spawn a new enemy (max enemies = this.round + 1)
    const activeEnemies = this.enemies.filter((e) => !e.isDead); // Only count alive enemies
    console.log("Active enemies: ", activeEnemies.length);

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

  // Main animation loop
  animate() {
    const currentTime = performance.now(); // Get the current time in milliseconds
    const deltaTime = (currentTime - this.lastTime) / 1000; // Calculate the time difference in seconds
    this.lastTime = currentTime; // Store the current time for the next frame

    requestAnimationFrame(this.animate);

    if (!this.controls.isLocked) {
      this.player.lockedControls = false;
    } else if (this.loadingScreen.style.display === "flex") {
      this.loadingScreen.style.display = "none";
      this.renderer.render(this.scene, this.camera);
    }

    if (this.player.lockedControls) {
      if (this.state.current !== "running") return;
      if (this.player.enemiesKilled.total > roundRequirements[this.round]) {
        this.round += 1;
      }
      this.manageEnemies();

      this.enemies.forEach((enemy) => {
        enemy.update(deltaTime);

        if (this.collisionManager.checkEnemyCollisions(enemy, this.player)) {
          this.collisionManager.handleEnemyPlayerCollision(enemy, this.player);
        }

        const hitEnemies = [];
        this.player.weapon.projectiles.forEach((proj) => {
          this.enemies.forEach((enemy) => {
            if (
              this.collisionManager.checkProjectileCollisionsWithRay(
                proj,
                enemy
              )
            ) {
              hitEnemies.push({ enemy, proj });
            }
          });
        });

        // Process damage after the collision checks
        hitEnemies.forEach(({ enemy, proj }) => {
          enemy.takeDamage(this.player.weapon.damage);
          proj.onDestroy(proj);
          this.player.showHitMarker();
        });

        // this.player.weapon.projectiles.forEach((proj) => {
        //   // Using raycast for projectile collision detection

        //   if (
        //     this.collisionManager.checkProjectileCollisionsWithRay(proj, enemy)
        //   ) {
        //     console.log("You shot the enemy!");
        //     enemy.takeDamage(this.player.weapon.damage); // Damage value from the projectile
        //     proj.onDestroy(proj);
        //   }
        // });
      });

      // Update light position based on player direction
      this.player.update(deltaTime); // Pass deltaTime to the player's update function
      this.view.update(deltaTime);
      this.renderer.render(this.scene, this.camera);
    }
  }
}
