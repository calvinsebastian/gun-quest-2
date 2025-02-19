import { playSound } from "../classes/playAudio.js";
import { handleFullscreen, handleMute } from "./eventListeners.js";

const weaponImage = document.getElementById("weapon");

const keyState = {};
let lastMouseUpdate = 0;
export const mouse = {
  x: 0,
  y: 0,
};

export function handleKeyPress(key, isPressed, player) {
  if (key === "Shift" || key === " ") {
    handleRunning(isPressed, player);
  }

  const normalizedKey = key.toLowerCase();

  keyState[normalizedKey] = isPressed;
  updatePlayerAcceleration(player);
}

async function handleRunning(state, player) {
  player.isRunning = state;
}

export function handleMouseMove(event, viewport, map) {
  const rect = viewport.getBoundingClientRect();
  const xValue = event.clientX - rect.left + map.xOffset;
  const yValue = event.clientY - rect.top + map.yOffset;
  mouse.x = Number(xValue.toFixed(1));
  mouse.y = Number(yValue.toFixed(1));
  lastMouseUpdate = Date.now(); // Update the timestamp when mouse moves
}

export function handleRightMouseClick(player) {
  player.currentProjectileIndex =
    (player.currentProjectileIndex + 1) % player.acquiredProjectiles.length;
  player.currentProjectile =
    player.acquiredProjectiles[player.currentProjectileIndex];

  weaponImage.src = player.currentProjectile.image;
}

export function handleMouseClick(player) {
  const direction = calculateDirection(player, mouse);
  if (
    player.currentProjectile.type === "ranged" &&
    player.currentProjectile.remainingAmmo > 0
  ) {
    const projectile = player.emitObject(direction, mouse);
    if (projectile) {
      player.projectiles.push(projectile);
      playSound(player.currentProjectile.sound, 0.3);
    }
  } else {
    const meleeStrike = player.emitObject(direction, mouse);
    if (meleeStrike) {
      player.meleeSwings.push(meleeStrike);
      playSound(player.currentProjectile.sound, 0.3);
    }
  }
}

function updatePlayerAcceleration(player) {
  player.ax = 0;
  player.ay = 0;

  if (
    (keyState["arrowleft"] || keyState["a"]) &&
    !(keyState["arrowright"] || keyState["d"])
  ) {
    player.ax = -player.acceleration;
  }
  if (
    (keyState["arrowright"] || keyState["d"]) &&
    !(keyState["arrowleft"] || keyState["a"])
  ) {
    player.ax = player.acceleration;
  }
  if (
    (keyState["arrowdown"] || keyState["s"]) &&
    !(keyState["arrowup"] || keyState["w"])
  ) {
    player.ay = player.acceleration;
  }
  if (
    (keyState["arrowup"] || keyState["w"]) &&
    !(keyState["arrowdown"] || keyState["s"])
  ) {
    player.ay = -player.acceleration;
  }

  if (player.ax !== 0 || player.ay !== 0) {
    // Player is moving; ensure mouse position update
    updateMousePositionIfNeeded();
  }
}

function updateMousePositionIfNeeded() {
  const currentTime = Date.now();
  if (currentTime - lastMouseUpdate > 50) {
    // Threshold to reduce frequency
    // Update mouse position if it's been some time since the last update
    mouse.x = mouse.x;
    mouse.y = mouse.y;
  }
}

function calculateDirection(player, mouse) {
  const dx = mouse.x - player.x - player.width / 2;
  const dy = mouse.y - player.y - player.height / 2;
  const magnitude = Math.sqrt(dx * dx + dy * dy);

  return {
    x: dx / magnitude,
    y: dy / magnitude,
  };
}
