import { Player } from "./classes/player.js";
import { Map } from "./classes/map.js";
import {
  handleKeyPress,
  handleMouseClick,
  handleMouseMove,
  handleRightMouseClick,
  mouse,
} from "./js/input.js";
import { Enemy } from "./classes/enemy.js";
import { enemyList } from "./js/variables/enemies.js";
import { deathRolls } from "./js/variables/deathRolls.js";
import { Item } from "./classes/item.js";
import { itemList } from "./js/variables/itemList.js";
import { projectiles } from "./js/variables/projectiles.js";
import { upgrades } from "./js/variables/upgrades.js";
import Message, {
  easyMessageList,
  messageList,
} from "./js/variables/messages.js";
import { loadHighscores, showHighscoreForm } from "./js/highscore.js";
import {
  checkForAchievements,
  showAchievementContent,
} from "./js/variables/achievements.js";
import {
  createWeightedArray,
  getRandomIntInRange,
  getRandomPositionOutsideRadius,
} from "./js/utility.js";
import {
  checkScreenSize,
  handleFullscreen,
  handleMute,
  handleResize,
  initiateEventListeners,
} from "./js/eventListeners.js";
import { playSound } from "./classes/playAudio.js";

// HTML elements

const hud = document.getElementById("hud");
const viewportContainer = document.getElementById("viewport-container");

const viewport = document.getElementById("viewport");
const ctx = viewport.getContext("2d");
const overlay = document.getElementById("overlay");
const overlayCtx = overlay.getContext("2d");

const storeContainer = document.querySelector(".store-container");
const storeTitle = document.getElementById("store-title");
const weaponImage = document.getElementById("weapon");
const storeWeaponName = document.getElementById("store-weapon-name");
const storeWeaponImage = document.getElementById("store-weapon-image");
const storeUpgradeImage = document.getElementById("store-upgrade-image");
const ammo = document.getElementById("ammo");
const ammoUp = document.getElementById("ammo-up");
const damage = document.getElementById("damage");
const speed = document.getElementById("speed");
const knockback = document.getElementById("knockback");
const cost = document.getElementById("cost");
const valueContainer = document.getElementById("value-container");
const value = document.getElementById("value");
const score = document.getElementById("score");
const currentRound = document.getElementById("round");

const achievementContainer = document.getElementById("achievement-container");
const unlockButton = document.getElementById("unlock-button");
const backButton = document.getElementById("back-button");

const titleScreen = document.getElementById("title-screen");
const startButton = document.getElementById("start-game");
const viewHighscoresButton = document.getElementById("highscores-button");
const settingsButton = document.getElementById("settings-button");
const settingsReturnButton = document.getElementById("settings-return-button");
const pauseButton = document.getElementById("pause");
const muteButton = document.getElementById("mute");
const cycleWeaponLeftButton = document.getElementById("cycle-weapon-left");
const cycleWeaponRightButton = document.getElementById("cycle-weapon-right");
const cycleUpgradeLeftButton = document.getElementById("cycle-upgrade-left");
const cycleUpgradeRightButton = document.getElementById("cycle-upgrade-right");
const upgradeButton = document.getElementById("upgrade-button");
const buyButton = document.getElementById("buy-button");

export const musicToggle = document.getElementById("music-toggle");
export const effectsToggle = document.getElementById("effects-toggle");
export const smoothingToggle = document.getElementById("smoothing-toggle");
export const easyToggle = document.getElementById("easy-mode-toggle");

document.addEventListener("DOMContentLoaded", async (event) => {
  window.addEventListener("resize", handleResize);
  checkScreenSize();
  // Select the button element
  // Check if the element exists
  if (startButton && hud && viewportContainer) {
    // Add the event listener
    startButton.addEventListener("click", initialize);
  } else {
    console.error('Button with id "startButton" not found.');
  }

  viewHighscoresButton.addEventListener("click", showHighscoreForm);
  settingsButton.addEventListener("click", () => {
    showSettings(true);
  });

  settingsReturnButton.addEventListener("click", () => {
    showSettings(false);
  });
});

// Game state

let messages = [];
let items = [];
let enemies = [];
let isAlertActive = false;
let alertQueue = [];
let isPaused = false;
let isMouseDown = false;
let lastItemSpawn = 0;
let currentStoreUpgradeIndex = 0;
let currentStoreProjectileIndex = 0;
let currentStoreProjectile = projectiles[currentStoreProjectileIndex];
let currentStoreUpgrade = upgrades[currentStoreUpgradeIndex];
let round = 0;
let enemyCount = 1;
let enemiesRemaining = 0;
let enemyPool = 0;
let lastEnemySpawn = 0;
let timeSinceRoundEnd = 0;
let newRoundTrigger = true;
let lastTime = 0;
let lastFireTime = 0;
export let dead = false;
const firingCooldown = 10;
let lastMouseX = mouse.x;
let lastMouseY = mouse.y;
export let backgroundMusic;
export let lit = false;

// Utility functions
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image at ${src}`));
  });
}

function loadAudio(src) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(src);
    audio.oncanplaythrough = () => resolve(audio);
    audio.onerror = () => reject(new Error(`Failed to load audio at ${src}`));
  });
}

function setPixelatedStyle(ctx) {
  ctx.imageSmoothingEnabled = false; // Disable smoothing for a pixelated effect
  ctx.mozImageSmoothingEnabled = false; // Firefox
  ctx.oImageSmoothingEnabled = false; // Opera
  ctx.webkitImageSmoothingEnabled = false; // Chrome and Safari
}

async function setupCanvasStyles() {
  //
  // Set all canvas elements to pixel style to increase sharpness of text and images

  if (viewport && overlay) {
    setPixelatedStyle(ctx);
    setPixelatedStyle(overlayCtx);
  } else {
    console.error("Canvas element not found.");
  }
}

async function showSettings(show) {
  const mainMenuContainer = document.getElementById("title-screen");
  mainMenuContainer.style.display = show ? "none" : "flex";
  const settingsContainer = document.getElementById("settings-screen");
  settingsContainer.style.display = show ? "flex" : "none";
}

async function handleApplyEasyMode(player) {
  storeTitle.innerHTML = "Spend your easy earned points here";
  player.score = 1400;
  player.maxHealth = 200;
  player.maxStamina = 200;
}

// Run initilization

// Proceed with the game loop or any other initialization

async function initialize() {
  try {
    // Preload all images
    const [patternImage] = await Promise.all([
      loadImage(
        easyToggle.checked
          ? "assets/images/GunQuest/cementTile2.png"
          : "assets/images/GunQuest/cementTile.png"
      ),
    ]);

    // Preload all  audio files
    [backgroundMusic] = await Promise.all([
      loadAudio(
        easyToggle.checked
          ? "assets/audio/music/cryptaGlyph1.mp3"
          : "assets/audio/music/cryptaGlyph3.mp3"
      ),
    ]);

    // Setup event listeners and canvas styles
    await initiateEventListeners();

    if (!smoothingToggle.checked) {
      await setupCanvasStyles();
    }

    if (musicToggle.checked)
      backgroundMusic.play().catch((error) => {
        console.error("Audio playback failed:", error);
      });

    hud.style.opacity = 1;
    viewportContainer.style.opacity = 1;
    titleScreen.style.display = "none";
    startGameLoop(patternImage, backgroundMusic);
  } catch (error) {
    console.error("Initialization failed:", error);
  }
}

// ######################################################################## //
// ######################################################################## //
// ##################      Handle on screen alerts       ################## //
// ######################################################################## //
// ######################################################################## //

function spawnMessage(text, player, font, color) {
  // Get position above player object
  const y = player.y - 22;

  // Create a temporary canvas context to measure text width
  const tempCtx = document.createElement("canvas").getContext("2d");
  tempCtx.font = `bold ${font}`; // Match the font used for drawing
  const textWidth = tempCtx.measureText(text).width;

  // Calculate the x position to center the text
  const x = player.x + player.width / 2;

  const textDuration = easyToggle.checked ? 4000 : 2200;

  // Create and add the message to the messages array
  const message = new Message(x, y, textWidth, text, color, font, textDuration);
  messages.push(message);
}

function showNextAlert(player) {
  if (alertQueue.length === 0) {
    isAlertActive = false;
    return;
  }
  isAlertActive = true;
  const nextMessage = alertQueue.shift();
  spawnMessage(nextMessage.text, player, nextMessage.font, nextMessage.color);

  const alertTimeout = easyToggle.checked ? 1000 : 500;
  // Set time between shown messages
  setTimeout(() => {
    showNextAlert(player);
  }, alertTimeout);
}

export function setAlert(message, player) {
  alertQueue.push(message);
  if (!isAlertActive) {
    showNextAlert(player);
  }
}

// ######################################################################## //
// ######################################################################## //
// ##################      End of on screen alerts       ################## //
// ######################################################################## //
// ######################################################################## //

// functions

function startGameLoop(patternImage, backgroundMusic) {
  //
  // Initialize temporary background in leiu of map
  const patternCanvas = document.createElement("canvas");
  const patternCtx = patternCanvas.getContext("2d");
  setPixelatedStyle(patternCtx);
  const patternWidth = 100;
  const patternHeight = 100;
  patternCanvas.width = patternWidth;
  patternCanvas.height = patternHeight;
  patternCtx.drawImage(patternImage, 0, 0, patternWidth, patternHeight);
  const pattern = ctx.createPattern(patternCanvas, "repeat");

  // Initialize background music settings
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.5;

  const gridCount = 20;
  const cellSize = 100;
  const mapDimension = gridCount * cellSize;
  const map = new Map(mapDimension, mapDimension, viewport, pattern);

  const player = new Player({
    x: (gridCount * cellSize) / 2 + 34,
    y: (gridCount * cellSize) / 2 + 34,
  });

  let weightedEnemyArray = createWeightedArray(enemyList[enemyPool]);

  if (easyToggle.checked) handleApplyEasyMode(player);

  // --------------------  HTML element Initialization  --------------------  //

  weaponImage.src = player.currentProjectile.image;
  storeWeaponName.innerHTML = currentStoreProjectile.name;
  storeWeaponImage.src = currentStoreProjectile.image;
  storeUpgradeImage.src = currentStoreUpgrade.image;
  currentRound.innerHTML = round;
  ammoUp.innerHTML = player.acquiredProjectiles[0].maxAmmo;
  damage.innerHTML = player.acquiredProjectiles[0].damage;
  speed.innerHTML = Math.abs(player.acquiredProjectiles[0].emitCooldown - 1000);
  knockback.innerHTML = player.acquiredProjectiles[0].knockbackForce;
  cost.innerHTML =
    player.acquiredProjectiles[0].upgrades[currentStoreUpgrade.projectileKey] *
    currentStoreUpgrade.cost *
    player.acquiredProjectiles[0].upgrades[currentStoreUpgrade.projectileKey];
  value.innerHTML =
    currentStoreUpgrade.type === "percentage"
      ? player.acquiredProjectiles[0][currentStoreUpgrade.defaultKey] *
        currentStoreUpgrade.projectileValue
      : Math.abs(currentStoreUpgrade.projectileValue);

  pauseButton.classList.remove("disabled");
  upgradeButton.classList.remove("hide");
  buyButton.classList.add("hide");
  if (!musicToggle?.checked && !effectsToggle.checked) {
    console.log("hide this", muteButton.style);
    muteButton.style.display = "none";
  }

  function updateWeapon() {
    storeWeaponImage.src = currentStoreProjectile.image;
    storeWeaponName.innerHTML = currentStoreProjectile.name;
    score.innerHTML = player.score;
    ammo.innerHTML =
      player.currentProjectile.remainingAmmo +
      " / " +
      player.currentProjectile.maxAmmo;

    const isAcquired = player.acquiredProjectiles.some(
      (acquired) => acquired.id === currentStoreProjectile.id
    );
    // Show/Hide buttons based on acquisition status
    if (isAcquired) {
      const playerProjectile = player.acquiredProjectiles.find(
        (acquired) => acquired.id === currentStoreProjectile.id
      );

      buyButton.classList.add("hide");
      upgradeButton.classList.remove("hide");
      storeUpgradeImage.classList.remove("hide");
      cycleUpgradeLeftButton.classList.remove("hide");
      cycleUpgradeRightButton.classList.remove("hide");
      cost.innerHTML =
        playerProjectile.upgrades[currentStoreUpgrade.projectileKey] *
        currentStoreUpgrade.cost *
        playerProjectile.upgrades[currentStoreUpgrade.projectileKey];
      valueContainer.style.display = "flex";
      value.innerHTML =
        currentStoreUpgrade.type === "percentage"
          ? playerProjectile[currentStoreUpgrade.defaultKey] *
            currentStoreUpgrade.projectileValue
          : Math.abs(currentStoreUpgrade.projectileValue);
      ammoUp.innerHTML = playerProjectile.maxAmmo;
      damage.innerHTML = playerProjectile.damage;
      speed.innerHTML = Math.abs(playerProjectile.emitCooldown - 1000);
      knockback.innerHTML = playerProjectile.knockbackForce;
    } else {
      buyButton.classList.remove("hide");
      upgradeButton.classList.add("hide");
      storeUpgradeImage.classList.add("hide");
      cycleUpgradeLeftButton.classList.add("hide");
      cycleUpgradeRightButton.classList.add("hide");
      cost.innerHTML = currentStoreProjectile.price;
      valueContainer.style.display = "none";
      ammoUp.innerHTML = currentStoreProjectile.maxAmmo;
      damage.innerHTML = currentStoreProjectile.damage;
      speed.innerHTML = Math.abs(currentStoreProjectile.emitCooldown - 1000);
      knockback.innerHTML = currentStoreProjectile.knockbackForce;
    }
  }

  function updateUpgradeImage() {
    storeUpgradeImage.src = currentStoreUpgrade.image;
    cost.innerHTML =
      currentStoreProjectile.upgrades[currentStoreUpgrade.projectileKey] *
      currentStoreUpgrade.cost *
      currentStoreProjectile.upgrades[currentStoreUpgrade.projectileKey];
    valueContainer.style.display = "flex";
    value.innerHTML =
      currentStoreUpgrade.type === "percentage"
        ? currentStoreProjectile[currentStoreUpgrade.defaultKey] *
          currentStoreUpgrade.projectileValue
        : Math.abs(currentStoreUpgrade.projectileValue);
  }

  cycleWeaponLeftButton.addEventListener("click", () => {
    currentStoreProjectileIndex =
      (currentStoreProjectileIndex - 1 + projectiles.length) %
      projectiles.length;
    currentStoreProjectile = projectiles[currentStoreProjectileIndex];

    updateWeapon();
  });
  cycleWeaponRightButton.addEventListener("click", () => {
    currentStoreProjectileIndex =
      (currentStoreProjectileIndex + 1) % projectiles.length;
    currentStoreProjectile = projectiles[currentStoreProjectileIndex];
    updateWeapon();
  });
  cycleUpgradeLeftButton.addEventListener("click", () => {
    currentStoreUpgradeIndex =
      (currentStoreUpgradeIndex - 1 + upgrades.length) % upgrades.length;
    currentStoreUpgrade = upgrades[currentStoreUpgradeIndex];
    updateUpgradeImage();
  });
  cycleUpgradeRightButton.addEventListener("click", () => {
    currentStoreUpgradeIndex = (currentStoreUpgradeIndex + 1) % upgrades.length;
    currentStoreUpgrade = upgrades[currentStoreUpgradeIndex];
    updateUpgradeImage();
  });

  upgradeButton.addEventListener("mouseover", () => {
    const playerProjectile = player.acquiredProjectiles.find(
      (acquired) => acquired.id === currentStoreProjectile.id
    );
    if (
      playerProjectile.upgrades[currentStoreUpgrade.projectileKey] *
        currentStoreUpgrade.cost *
        playerProjectile.upgrades[currentStoreUpgrade.projectileKey] >
      player.score
    ) {
      upgradeButton.style.backgroundColor = "red";
      upgradeButton.innerText = "You broke";
    }
    if (
      currentStoreProjectile[currentStoreUpgrade.projectileKey] +
        currentStoreUpgrade.projectileValue <=
      1
    ) {
      upgradeButton.style.backgroundColor = "blue";
      upgradeButton.innerText = "Maxed Out!";
    }
  });
  upgradeButton.addEventListener("mouseout", () => {
    upgradeButton.style.backgroundColor = "white";
    upgradeButton.innerText = "Upgrade";
  });
  upgradeButton.addEventListener("click", () => {
    const playerProjectile = player.acquiredProjectiles.find(
      (acquired) => acquired.id === currentStoreProjectile.id
    );
    if (
      playerProjectile.upgrades[currentStoreUpgrade.projectileKey] *
        currentStoreUpgrade.cost *
        playerProjectile.upgrades[currentStoreUpgrade.projectileKey] <
        player.score &&
      playerProjectile[currentStoreUpgrade.projectileKey] +
        currentStoreUpgrade.projectileValue >=
        1
    ) {
      // subtract score
      player.score =
        player.score -
        playerProjectile.upgrades[currentStoreUpgrade.projectileKey] *
          currentStoreUpgrade.cost *
          playerProjectile.upgrades[currentStoreUpgrade.projectileKey];

      // update upgrade count

      playerProjectile.upgrades[currentStoreUpgrade.projectileKey] += 1;

      // upgrade weapon

      if (currentStoreUpgrade.type === "percentage") {
        playerProjectile[currentStoreUpgrade.projectileKey] +=
          playerProjectile[currentStoreUpgrade.defaultKey] *
          currentStoreUpgrade.projectileValue;
      } else {
        playerProjectile[currentStoreUpgrade.projectileKey] +=
          currentStoreUpgrade.projectileValue;
      }

      // update weapon

      updateWeapon();
    } else {
      if (
        playerProjectile[currentStoreUpgrade.projectileKey] +
          currentStoreUpgrade.projectileValue <=
        1
      ) {
        upgradeButton.style.backgroundColor = "blue";
        upgradeButton.innerText = "Maxed Out!";
      } else {
        upgradeButton.style.backgroundColor = "red";
        upgradeButton.innerText = "You broke";
      }
    }
  });

  // unlock button

  unlockButton.addEventListener("click", () => {
    storeContainer.classList.add("hide");
    achievementContainer.classList.remove("hide");
    showAchievementContent(player);
  });

  // unlock button

  backButton.addEventListener("click", () => {
    storeContainer.classList.remove("hide");
    achievementContainer.classList.add("hide");
  });

  // purchase button

  buyButton.addEventListener("mouseover", () => {
    if (currentStoreProjectile.price > player.score) {
      buyButton.style.backgroundColor = "red";
      buyButton.innerText = "You broke";
    }
  });
  buyButton.addEventListener("mouseout", () => {
    buyButton.style.backgroundColor = "white";
    buyButton.innerText = "Buy";
  });
  buyButton.addEventListener("click", () => {
    if (currentStoreProjectile.price < player.score) {
      // subtract score
      player.score = player.score - currentStoreProjectile.price;

      // add weapon to acquired projectiles

      player.acquiredProjectiles = [
        ...player.acquiredProjectiles,
        currentStoreProjectile,
      ];

      // update projectile aquisition achievement

      player.purchaseAchievements[0].count += 1;

      // update weapon

      updateWeapon();
    } else {
      if (
        playerProjectile[currentStoreUpgrade.projectileKey] +
          currentStoreUpgrade.projectileValue <=
        1
      ) {
        buyButton.style.backgroundColor = "blue";
        buyButton.innerText = "Maxed Out!";
      } else {
        buyButton.style.backgroundColor = "red";
        buyButton.innerText = "You broke";
      }
    }
  });

  function handlePause() {
    if (!dead) {
      if (isPaused) {
        pauseButton.innerHTML = "Shop (e)";
        achievementContainer.classList.add("hide");
        resumeGame();
      } else {
        pauseButton.innerHTML = "Resume (e)";
        storeContainer.style.display = "flex";
        pauseGame();
      }
    }
  }

  document.addEventListener("keydown", onEscapeKeyDown);
  pauseButton.addEventListener("click", () => {
    handlePause();
  });

  function onEscapeKeyDown(event) {
    if (!dead) {
      event.preventDefault();
      if (event.key === "Escape" || event.key === "e") {
        handleKeyPress("w", false, player);
        handleKeyPress("a", false, player);
        handleKeyPress("s", false, player);
        handleKeyPress("d", false, player);
        handleMouseEvent(null, false);
        handlePause();
      }
      if (event.key === "f") {
        return handleFullscreen();
      }
      if (event.key === "m") {
        return handleMute();
      }
    }
  }

  function onKeyDown(event) {
    event.preventDefault();
    handleKeyPress(event.key, true, player);
  }

  function onKeyUp(event) {
    handleKeyPress(event.key, false, player);
  }

  function onMouseMove(event) {
    event.preventDefault();
    handleMouseMove(event, viewport, map);
  }

  function onMouseDown(event) {
    event.preventDefault();
    handleMouseEvent(event, true);
  }

  function onMouseUp(event) {
    event.preventDefault();
    handleMouseEvent(event, false);
  }

  async function handleMouseEvent(event, state) {
    event?.preventDefault();
    if (event?.button === 2 && state) {
      return handleRightMouseClick(player);
    }
    isMouseDown = state;
  }

  function addEventListeners() {
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    viewport.addEventListener("mousemove", onMouseMove);
    viewport.addEventListener("mousedown", onMouseDown);
    viewport.addEventListener("mouseup", onMouseUp);
  }

  function removeEventListeners() {
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keyup", onKeyUp);
    viewport.removeEventListener("mousemove", onMouseMove);
    viewport.removeEventListener("mousedown", onMouseDown);
    viewport.removeEventListener("mouseup", onMouseUp);
  }

  function pauseGame() {
    isPaused = true;
    removeEventListeners();
  }

  function resumeGame() {
    isPaused = false;
    addEventListeners();
  }

  addEventListeners();

  // create new death roll array based on weight values
  const weightedDeathRolls = createWeightedArray(deathRolls, player);

  // handle death roll
  function handleDeathSpawn(enemy) {
    let deathRoll =
      weightedDeathRolls[Math.floor(Math.random() * weightedDeathRolls.length)];

    if (deathRoll.drop) {
      handleDrop(deathRoll.drop, enemy);
    }
  }

  // place item drop if it appears in a death roll
  function handleDrop(drop, enemy) {
    const enemyCenter = {
      x: enemy.x + enemy.width / 2,
      y: enemy.y + enemy.height / 2,
    };
    if (drop.type === "ammo") {
      items.push(
        new Item(enemyCenter.x, enemyCenter.y, map.element, {
          ...itemList[1],
          value: getRandomIntInRange(20, 100),
        })
      );
    } else if (drop.type === "health") {
      items.push(
        new Item(enemyCenter.x, enemyCenter.y, map.element, {
          ...itemList[2],
          value: getRandomIntInRange(20, 100),
        })
      );
    } else if (drop.type === "stamina") {
      items.push(
        new Item(enemyCenter.x, enemyCenter.y, map.element, {
          ...itemList[3],
          value: getRandomIntInRange(20, 100),
        })
      );
    } else if (drop.type === "score") {
      items.push(
        new Item(enemyCenter.x, enemyCenter.y, map.element, {
          ...itemList[4],
          value: getRandomIntInRange(20, 100),
        })
      );
    } else if (drop.type === "lantern") {
      items.push(
        new Item(enemyCenter.x, enemyCenter.y, map.element, {
          ...itemList[5],
          value: 1,
        })
      );
    }
  }

  // show leaderboards
  function drawGameOver() {
    playSound("./assets/audio/effects/death.wav", 0.5);
    dead = true;
    removeEventListeners();

    ctx.clearRect(0, 0, viewport.width, viewport.height);
    ctx.save();
    if (easyToggle.checked) {
      showHighscoreForm(0, 0, 0);
    } else {
      showHighscoreForm(player.score, round, player.defeatedEnemies);
    }
    ctx.restore();
  }

  // draw the store
  function drawStore() {
    ctx.clearRect(0, 0, viewport.width, viewport.height);
    ctx.save();
    storeContainer.classList.remove("hide");
    ctx.restore();
  }

  // handle random item spawns
  function spawnRandomItems() {
    const newPosition = getRandomPositionOutsideRadius(
      player.x + player.width / 2,
      player.y + player.height / 2,
      map.width,
      map.height
    );
    const newPosition2 = getRandomPositionOutsideRadius(
      player.x + player.width / 2,
      player.y + player.height / 2,
      map.width,
      map.height
    );
    items.push(
      new Item(newPosition.x, newPosition.y, map.element, itemList[1])
    );
    items.push(
      new Item(newPosition2.x, newPosition2.y, map.element, itemList[2])
    );
  }

  async function startNewRound() {
    timeSinceRoundEnd = 0;
    const maxEnemyIncrease = Math.floor(
      Math.random() * parseInt((round + enemyPool) / 2)
    );
    if (easyToggle.checked) {
      const enemyIncrease = 1;
      const newEnemyCount = enemyCount + enemyIncrease;
      enemyCount = newEnemyCount;
      enemiesRemaining = newEnemyCount;
    } else {
      const enemyIncrease =
        maxEnemyIncrease > 2
          ? maxEnemyIncrease
          : Math.floor(Math.random() * (3 - 1) + 1);
      const newEnemyCount = enemyCount + enemyIncrease;
      enemyCount = newEnemyCount;
      enemiesRemaining = newEnemyCount;
    }
    if ((round + 1) % 5 === 0) {
      const newPoolValue = enemyPool + 1;
      weightedEnemyArray = createWeightedArray(enemyList[newPoolValue]);
      enemyPool = newPoolValue;
    }
    if (round % 5 === 0) {
      backgroundMusic.playbackRate += 0.1;
    }
    newRoundTrigger = true;
    handleMessageTriggers();
  }

  function handleMessageTriggers() {
    if (easyToggle.checked) {
      if (easyMessageList[round]?.text) {
        setAlert(easyMessageList[round], player);
      }
    } else {
      if (messageList[round]?.text) {
        setAlert(messageList[round], player);
      }
    }
  }

  let lastMapXOffset = map.xOffset;
  let lastMapYOffset = map.yOffset;

  //  --------------------  Main Game Loop  --------------------  //

  function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;
    lastItemSpawn += deltaTime;
    lastEnemySpawn += deltaTime;

    if (player.health < 1) {
      return drawGameOver();
    }
    if (isPaused) {
      drawStore();
    } else {
      if (!easyToggle.checked) {
        checkForAchievements(player);
      }

      if (player.isLit) {
        player.timeSinceLit += deltaTime;
        if (player.timeSinceLit >= 15) {
          playSound("./assets/audio/effects/unlit.wav", 0.8);
          player.isLit = false;
          player.timeSinceLit = 0;
        }
      }
      if (lastMouseX === mouse.x) {
        const differenceBetweenLastXOffset = -lastMapXOffset + map.xOffset;
        mouse.x += differenceBetweenLastXOffset;
      }
      if (lastMouseY === mouse.y) {
        const differenceBetweenLastYOffset = -lastMapYOffset + map.yOffset;
        mouse.y += differenceBetweenLastYOffset;
      }
      if (lastMouseX !== mouse.x) {
        lastMouseX = mouse.x;
      }
      if (lastMouseY !== mouse.y) {
        lastMouseY = mouse.y;
      }
      lastMapXOffset = map.xOffset;
      lastMapYOffset = map.yOffset;

      if (enemies.length === 0 && enemiesRemaining === 0) {
        if (newRoundTrigger) {
          const nextRound = round + 1;
          const newRoundMessage = {
            text: `Round ${nextRound}`,
            font: "24px 'Press Start 2P'",
            color: "red",
          };
          if (!easyToggle.checked) setAlert(newRoundMessage, player);
          round = nextRound;
          currentRound.innerHTML = round;
          newRoundTrigger = false;
        }
        timeSinceRoundEnd += deltaTime;
        if (timeSinceRoundEnd >= 3) {
          startNewRound();
        }
      } else {
        if (
          lastEnemySpawn >= 0.35 &&
          enemiesRemaining > 0 &&
          enemies.length < 30
        ) {
          const position = getRandomPositionOutsideRadius(
            player.x + player.width / 2,
            player.y + player.height / 2,
            map.width,
            map.height
          );
          enemiesRemaining = enemiesRemaining - 1;
          enemies.push(
            new Enemy(
              position.x,
              position.y,
              map.element,
              weightedEnemyArray[
                Math.floor(Math.random() * weightedEnemyArray.length)
              ]
            )
          );
          lastEnemySpawn = 0;
        }
      }

      if (lastItemSpawn > 20) {
        spawnRandomItems();
        lastItemSpawn = 0;
      }

      if (isMouseDown && currentTime - lastFireTime > firingCooldown) {
        handleMouseClick(player);
        lastFireTime = currentTime;
      }

      // Hide store once unpaused
      if (storeContainer.style.display === "flex") {
        storeContainer.style.display = "none";
        achievementContainer.classList.add("hide");
      }

      player.update(map, deltaTime, viewport);

      for (const message of messages) {
        message.update(player);
      }

      for (const enemy of enemies) {
        enemy.update(player, enemies, deltaTime, map);
      }

      for (const item of items) {
        item.update(player, items, deltaTime);
      }

      for (const projectile of player.projectiles) {
        projectile.update(deltaTime);
        for (const enemy of enemies) {
          if (projectile.checkCollision(enemy)) {
            enemy.isAggroed = true;
            const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            enemy.knockback.x = -Math.cos(angle) * projectile.knockbackForce;
            enemy.knockback.y = -Math.sin(angle) * projectile.knockbackForce;

            if (!enemy.isBlinking) {
              enemy.isBlinking = true;
              enemy.blinkTime = 1.0;
            }
            enemy.health -= projectile.damage;
            if (enemy.health <= 0) {
              enemy.destroy();
              const index = enemies.indexOf(enemy);
              if (index > -1) {
                enemies.splice(index, 1);
              }
              handleDeathSpawn(enemy);
              player.defeatedEnemies += 1;
              player.score += enemy.value;
              player.killAchievements[enemy.id - 1].count += 1;
            }
            projectile.lifespan = 0;
          }
        }
      }
      for (const meleeSwing of player.meleeSwings) {
        meleeSwing.update(deltaTime);
        for (const enemy of enemies) {
          if (meleeSwing.checkCollision(enemy, map)) {
            console.log("hit enemy");
          }
        }
      }
    }

    player.projectiles = player.projectiles.filter((p) => p.lifespan > 0);
    player.meleeSwings = player.meleeSwings.filter((m) => m.lifespan > 0);

    ctx.clearRect(0, 0, viewport.width, viewport.height);
    ctx.save();
    overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
    overlayCtx.save();

    map.draw(ctx, viewport);
    player.draw(overlayCtx, map);
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.isExpired()) {
        messages.splice(i, 1); // Remove the expired message
      } else {
        message.draw(overlayCtx, map);
      }
    }
    for (const projectile of player.projectiles) {
      projectile.draw(ctx, map);
    }
    for (const meleeSwing of player.meleeSwings) {
      meleeSwing.draw(ctx, map);
    }
    for (const enemy of enemies) {
      enemy.draw(ctx, map, player);
    }
    for (const item of items) {
      item.draw(ctx, map);
    }

    // Visibility circle
    if (!easyToggle.checked) {
      ctx.globalCompositeOperation = "destination-in";
      const fadeGradient = ctx.createRadialGradient(
        player.x + player.width / 2 - map.xOffset,
        player.y + player.height / 2 - map.yOffset,
        0,
        player.x + player.width / 2 - map.xOffset,
        player.y + player.height / 2 - map.yOffset,
        player.visibilityRadius
      );
      fadeGradient.addColorStop(0, "rgba(0, 0, 0, .9)"); // Slightly dimmed center
      fadeGradient.addColorStop(1, "rgba(0, 0, 0, 0)"); // Fully transparent at the edge

      ctx.beginPath();
      ctx.arc(
        player.x + player.width / 2 - map.xOffset,
        player.y + player.height / 2 - map.yOffset,
        player.visibilityRadius,
        0,
        2 * Math.PI
      );
      ctx.fillStyle = fadeGradient;
      ctx.fill();

      ctx.globalCompositeOperation = "destination-out";

      const mouseX = mouse.x - map.xOffset; // Mouse x-coordinate
      const mouseY = mouse.y - map.yOffset; // Mouse y-coordinate
      const playerCenterX = player.x + player.width / 2 - map.xOffset;
      const playerCenterY = player.y + player.height / 2 - map.yOffset;

      const angle = Math.atan2(mouseY - playerCenterY, mouseX - playerCenterX);
      const pieRadius = player.visibilityRadius;
      const pieAngle = Math.PI / player.currentProjectile.visibility; // Adjusted pie slice width

      // Flashlight
      const radialHighlight = ctx.createRadialGradient(
        playerCenterX,
        playerCenterY,
        0,
        playerCenterX,
        playerCenterY,
        pieRadius
      );
      radialHighlight.addColorStop(0, "rgba(0, 0, 0, .97)"); // Fully transparent in the direction of the mouse
      radialHighlight.addColorStop(1, "rgba(0, 0, 0, 1)"); // Darker at the edge

      if (!player.isLit) {
        ctx.beginPath();
        ctx.moveTo(playerCenterX, playerCenterY);
        ctx.arc(
          playerCenterX,
          playerCenterY,
          pieRadius,
          angle + pieAngle / 2,
          angle - pieAngle / 2
        );
        ctx.lineTo(playerCenterX, playerCenterY);
        ctx.closePath();
        ctx.fillStyle = radialHighlight;
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";

      // Secondary light

      // const pieAngle2 = Math.PI / 1.2;

      // // Create a radial gradient for the pie-shaped light
      // const radialHighlight2 = ctx.createRadialGradient(
      //   playerCenterX,
      //   playerCenterY,
      //   0,
      //   playerCenterX,
      //   playerCenterY,
      //   pieRadius
      // );
      // radialHighlight2.addColorStop(0, "rgba(0, 0, 0, .5)"); // Fully transparent in the direction of the mouse
      // radialHighlight2.addColorStop(1, "rgba(0, 0, 0, .8)"); // Darker at the edge

      // ctx.beginPath();
      // ctx.moveTo(playerCenterX, playerCenterY);
      // ctx.arc(
      //   playerCenterX,
      //   playerCenterY,
      //   pieRadius * 2,
      //   angle + pieAngle2 / 2,
      //   angle - pieAngle2 / 2
      // );
      // ctx.lineTo(playerCenterX, playerCenterY);
      // ctx.closePath();
      // ctx.fillStyle = radialHighlight2;
      // ctx.fill();
      // ctx.globalCompositeOperation = "source-over";

      const playerBlock = ctx.createRadialGradient(
        playerCenterX,
        playerCenterY,
        0,
        playerCenterX,
        playerCenterY,
        pieRadius
      );
      playerBlock.addColorStop(0, "rgba(10, 10, 10, 1)"); // Fully transparent in the direction of the mouse
      playerBlock.addColorStop(1, "rgba(10, 10, 10, 1)"); // Darker at the edge

      ctx.beginPath();
      ctx.moveTo(playerCenterX, playerCenterY);
      ctx.arc(playerCenterX, playerCenterY, 12, 0, 360);
      ctx.lineTo(playerCenterX, playerCenterY);
      ctx.closePath();
      ctx.fillStyle = playerBlock;
      ctx.fill();

      // Restore the composite operation to default
      ctx.globalCompositeOperation = "source-over";
    } else {
      // ctx.globalCompositeOperation = "source-over"; // Reset composite operation

      // Draw a solid background to darken the entire canvas
      ctx.fillStyle = "rgba(0, 0, 0, 0)"; // Dark semi-transparent background
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      // Create the radial gradient to reveal the circle area
      const fadeGradient = ctx.createRadialGradient(
        player.x + player.width / 2 - map.xOffset,
        player.y + player.height / 2 - map.yOffset,
        0,
        player.x + player.width / 2 - map.xOffset,
        player.y + player.height / 2 - map.yOffset,
        400
      );
      fadeGradient.addColorStop(0, "rgba(0, 0, 0, 1)"); // Dark at the edge
      fadeGradient.addColorStop(1, "rgba(0, 0, 0, 0)"); // Fully transparent at the center

      // Apply the gradient to the canvas
      ctx.globalCompositeOperation = "destination-in"; // Keep only the area where the gradient is drawn
      ctx.beginPath();
      ctx.arc(
        player.x + player.width / 2 - map.xOffset,
        player.y + player.height / 2 - map.yOffset,
        400,
        0,
        2 * Math.PI
      );
      ctx.fillStyle = fadeGradient;
      ctx.fill();

      // Reset globalCompositeOperation to default
      ctx.globalCompositeOperation = "source-over";
    }

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
}
