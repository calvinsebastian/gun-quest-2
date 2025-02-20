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
import Stats from "stats.js";

const stats1 = new Stats();
stats1.showPanel(0); // FPS
document.body.appendChild(stats1.dom);

const stats2 = new Stats();
stats2.showPanel(1); // MS
stats2.dom.style.cssText = "position:absolute;top:0;left:80px;";
document.body.appendChild(stats2.dom);

const stats3 = new Stats();
stats3.showPanel(2); // Memory
stats3.dom.style.cssText = "position:absolute;top:0;left:160px;";
document.body.appendChild(stats3.dom);

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
        this.round = 1;

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

        console.log(aimingReticle.style);
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
    const activeEnemies = this.enemies.filter((e) => !e.isDead); // Only count alive enemies

    if (activeEnemies.length < this.round + 1) {
      // Get random enemy configuration
      const enemyArrayIndex = this.round - 1;
      const enemyConfig = {
        ...enemies[enemyArrayIndex][
          Math.floor(Math.random() * enemies[enemyArrayIndex].length)
        ],
        uuid: generateUUID(),
        position: generateEnemyPosition(
          this.view.level.occupiedCells,
          this.player.camera.position
        ),
      };

      // Create a new enemy and pass the onDestroy callback
      const enemy = new Enemy(
        this.scene,
        this.view.level,
        this.player,
        enemyConfig,
        (e) => {
          e.isDead = true; // Mark as dead

          // Find and remove the enemy from the enemies array
          const index = this.enemies.findIndex((obj) => obj.uuid === e.uuid);
          if (index !== -1) {
            // Remove the enemy from the array
            this.enemies.splice(index, 1);
            this.player.enemiesKilled[this.player.weapon.name] += 1;
            this.player.enemiesKilled.total += 1;
          }
        }
      );

      // Add the newly created enemy to the enemies array
      this.enemies.push(enemy);
    }
  }

  gameOver() {
    this.player.lockedControls = false;
    if (!this.restartingGame) {
      this.restartingGame = true;
      console.log("game over");
      const gameOverScreen = document.getElementById("game-over");
      gameOverScreen.style.display = "flex";

      setTimeout(() => {
        window.location.reload(); // This will reload the page
      }, 3000); // Delay before reload
    }
  }

  // Main animation loop
  animate() {
    // Performance monitoring
    stats1.begin();
    stats2.begin();
    stats3.begin();

    const currentTime = performance.now(); // Get the current time in milliseconds
    const deltaTime = (currentTime - this.lastTime) / 1000; // Calculate the time difference in seconds
    this.lastTime = currentTime; // Store the current time for the next frame

    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);

    if (!this.controls.isLocked) {
      this.player.lockedControls = false;
    } else if (this.loadingScreen.style.display === "flex") {
      this.loadingScreen.style.display = "none";
    }

    if (this.player.lockedControls) {
      if (this.state.current !== "running") return;
      if (this.player.isDead) {
        return this.gameOver();
      }

      if (this.player.enemiesKilled.total > roundRequirements[this.round]) {
        this.round += 1;
      }
      this.manageEnemies();

      this.enemies.forEach((enemy) => {
        enemy.update(deltaTime);

        if (!enemy.collidedWithPlayer) {
          if (this.collisionManager.checkEnemyCollisions(enemy, this.player)) {
            playSound(
              this.player.stats.currentHealth > 0
                ? "/assets/audio/effects/hit.wav"
                : "/assets/audio/effects/death.wav",
              0.5
            );

            if (this.player.stats.currentHealth <= 0) {
              this.player.isDead = true;
            }

            this.collisionManager.handleEnemyPlayerCollision(
              enemy,
              this.player
            );
          }
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
      });

      // Update light position based on player direction
      this.player.update(deltaTime); // Pass deltaTime to the player's update function
      this.view.update(deltaTime);
      this.renderer.render(this.scene, this.camera);
    }
    // End of performance monitoring
    stats1.end();
    stats2.end();
    stats3.end();
  }
}
