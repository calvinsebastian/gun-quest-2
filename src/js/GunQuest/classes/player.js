import { drawRoundedRect } from "../js/drawing.js";
import { Projectile } from "./projectile.js";
import { upgrades } from "../js/variables/upgrades.js";
import { projectiles } from "../js/variables/projectiles.js";
import { mouse } from "../js/input.js";
import {
  itemAchievements,
  killAchievements,
  purchaseAchievements,
} from "../js/variables/achievements.js";
import { MeleeSwing } from "./meleeSwing.js";

export class Player {
  constructor(startingPosition) {
    this.score = 0;
    // this.score = 100000000;
    this.defeatedEnemies = 0;
    this.killAchievements = killAchievements;
    this.itemAchievements = itemAchievements;
    this.purchaseAchievements = purchaseAchievements;
    // logistics
    this.x = startingPosition.x;
    this.y = startingPosition.y;
    this.width = 32;
    this.height = 32;
    this.dx = 0;
    this.dy = 0;
    this.ax = 0;
    this.ay = 0;
    this.friction = 0.9;
    this.maxSpeed = 700;
    this.baseAcceleration = 1100;
    this.acceleration = this.baseAcceleration;

    // stats
    this.color = "rgb(40,120,180)";
    this.health = 100;
    this.maxHealth = 100;
    this.lastHealthRecovery = 0;
    this.healthRecoveryRate = 1000;
    this.healthRecoveryAmount = 1;
    this.stamina = 100;
    this.maxStamina = 100;
    this.lastStaminaRecovery = 0;
    this.staminaRecoveryRate = 100;
    this.staminaRecoveryAmount = 1;
    this.isRunning = false;
    this.lastStaminaDrain = 0;
    this.staminaDrainCooldown = 100;
    this.staminaDrainAmount = 4;
    this.visibilityRadius = 300;
    this.isLit = false;
    this.timeSinceLit = 0;
    // collision
    this.isBlinking = false;
    this.blinkTime = 0;
    this.knockback = { x: 0, y: 0 };
    this.knockbackForce = 200;

    // Sprite animation
    this.sprite = new Image();
    this.sprite.src = "/assets/images/GunQuest/character.png";
    this.sprite.onload = () => {
      // Handle the case where the sprite is loaded
    };

    // Projectile
    this.currentProjectileIndex = 0;
    this.acquiredProjectiles = [projectiles[0]];
    // this.acquiredProjectiles = [...projectiles];
    this.currentProjectile = projectiles[0];
    this.currentUpgrade = upgrades[0];
    this.lastEmitTime = 0;
    this.projectiles = [];
    this.meleeSwings = [];
    this.rotation = 0;
  }

  update(map, deltaTime, viewport) {
    const now = performance.now();

    // handle stats
    const score = document.getElementById("score");
    score.innerHTML = this.score;
    const health = document.getElementById("health");
    health.innerHTML = this.health;
    const stamina = document.getElementById("stamina");
    stamina.innerHTML = this.stamina;
    const ammo = document.getElementById("ammo");
    ammo.innerHTML =
      this.currentProjectile.remainingAmmo +
      " / " +
      this.currentProjectile.maxAmmo;

    const cellWidth = 100;

    // Apply acceleration to velocity
    this.dx += this.ax * deltaTime;
    this.dy += this.ay * deltaTime;

    // Apply friction
    this.dx *= this.friction;
    this.dy *= this.friction;

    // Clamp velocity to max speed
    const speed = Math.sqrt(this.dx ** 2 + this.dy ** 2);
    if (speed > this.maxSpeed) {
      this.dx *= this.maxSpeed / speed;
      this.dy *= this.maxSpeed / speed;
    }

    // Apply knockback if present
    if (this.knockback.x !== 0 || this.knockback.y !== 0) {
      this.x += this.knockback.x * deltaTime;
      this.y += this.knockback.y * deltaTime;

      // Apply friction to knockback
      this.knockback.x *= this.friction;
      this.knockback.y *= this.friction;

      // Reset knockback if it's below a threshold
      if (Math.abs(this.knockback.x) < 0.1) this.knockback.x = 0;
      if (Math.abs(this.knockback.y) < 0.1) this.knockback.y = 0;
    }

    // Calculate new position
    const newX = this.x + this.dx * deltaTime;
    const newY = this.y + this.dy * deltaTime;

    // Constrain player to map boundaries
    this.x = Math.max(
      cellWidth,
      Math.min(newX, map.width - this.width - cellWidth)
    );
    this.y = Math.max(
      cellWidth,
      Math.min(newY, map.height - this.height - cellWidth)
    );

    // Handle running state and stamina drain
    if (this.isRunning) {
      if (this.stamina > 5) {
        this.acceleration = 1700; // Increased acceleration while running

        if (
          now - this.lastStaminaDrain > this.staminaDrainCooldown &&
          (Math.abs(this.dx) > 100 || Math.abs(this.dy) > 100)
        ) {
          this.stamina = Math.max(this.stamina - this.staminaDrainAmount, 0);
          this.lastStaminaDrain = now;
        }
      } else {
        this.isRunning = false;
        this.acceleration = this.baseAcceleration; // Reset to base acceleration
        this.dx = this.dx < -90 ? -90 : this.dx > 90 ? 90 : this.dx;
        this.dy = this.dy < -90 ? -90 : this.dy > 90 ? 90 : this.dy;
      }
    } else {
      this.acceleration = this.baseAcceleration; // Normal acceleration
      this.dx = this.dx < -90 ? -90 : this.dx > 90 ? 90 : this.dx;
      this.dy = this.dy < -90 ? -90 : this.dy > 90 ? 90 : this.dy;
    }

    this.dx = parseInt(this.dx);
    this.dy = parseInt(this.dy);

    // Handle blinking effect
    if (this.isBlinking) {
      this.blinkTime -= deltaTime;
      if (this.blinkTime <= 0) {
        this.isBlinking = false;
      }
    }

    // Check if it's time to recover stamina

    if (now - this.lastStaminaRecovery > this.staminaRecoveryRate) {
      // Calculate how many recovery intervals have passed
      const recoveryIntervals = Math.floor(
        (now - this.lastStaminaRecovery) / this.staminaRecoveryRate
      );
      // Increase stamina based on the number of recovery intervals
      this.stamina = Math.min(
        this.maxStamina,
        this.stamina + recoveryIntervals * this.staminaRecoveryAmount
      );
      // Update the last recovery timestamp
      this.lastStaminaRecovery = now;
    }

    // Check if it's time to recover health

    if (now - this.lastHealthRecovery > this.healthRecoveryRate) {
      // Calculate how many recovery intervals have passed
      const recoveryIntervals = Math.floor(
        (now - this.lastHealthRecovery) / this.healthRecoveryRate
      );
      // Increase health based on the number of recovery intervals
      this.health = Math.min(
        this.maxHealth,
        this.health + recoveryIntervals * this.healthRecoveryAmount
      );
      // Update the last recovery timestamp
      this.lastHealthRecovery = now;
    }

    // Update projectiles
    this.projectiles.forEach((projectile) => projectile.update(deltaTime));
    this.projectiles = this.projectiles.filter(
      (projectile) => projectile.lifespan > 0
    );

    // Update map offset
    map.xOffset = Math.max(
      0,
      Math.min(
        map.width - viewport.width,
        this.x - viewport.width / 2 + this.width / 2
      )
    );
    map.yOffset = Math.max(
      0,
      Math.min(
        map.height - viewport.height,
        this.y - viewport.height / 2 + this.height / 2
      )
    );

    // Update sprite animation
    // this.animation.update(deltaTime);
  }

  draw(ctx, map) {
    if (this.isBlinking && this.blinkTime % 0.1 < 0.05) {
      return; // Skip drawing during blink effect
    }

    // Old player placeholder

    // ctx.fillStyle = this.color;
    // const radius = this.width / 2;
    // ctx.beginPath();
    // ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    // ctx.fill();
    // ctx.closePath();

    // Draw player
    const centerX = this.x + this.width / 2 - map.xOffset;
    const centerY = this.y + this.height / 2 - map.yOffset;
    const cursorY = mouse.y - map.yOffset;
    const cursorX = mouse.x - map.xOffset;

    // Calculate the angle to the cursor
    const angle = Math.atan2(cursorY - centerY, cursorX - centerX);

    // Save the current canvas state
    ctx.save();

    // Translate canvas to player's center
    ctx.translate(centerX, centerY);

    // Rotate canvas to face the cursor
    ctx.rotate(angle);

    // Draw the sprite (adjusting for the center of rotation)
    ctx.drawImage(
      this.sprite,
      -this.width / 2, // X offset: negative half width to center the sprite
      -this.height / 2, // Y offset: negative half height to center the sprite
      this.width,
      this.height
    );

    // Restore the canvas state
    ctx.restore();

    // Draw health bar
    const healthBarWidth = this.width;
    const healthBarHeight = 4; // Height of the health bar
    const healthBarX = this.x - map.xOffset;
    const healthBarY = this.y - map.yOffset - 10; // Position above the player
    const cornerRadius = 2;

    // Draw the full health bar
    ctx.fillStyle = "rgb(255,0,0)";
    drawRoundedRect(
      ctx,
      healthBarX,
      healthBarY,
      healthBarWidth,
      healthBarHeight,
      cornerRadius
    );

    // Draw current health
    ctx.fillStyle = "rgb(0, 255, 0)";
    const currentHealthWidth = (this.health / this.maxHealth) * healthBarWidth;
    drawRoundedRect(
      ctx,
      healthBarX,
      healthBarY,
      currentHealthWidth,
      healthBarHeight,
      cornerRadius
    );

    // Draw stamina bar
    const staminaBarWidth = this.width;
    const staminaBarHeight = 2; // Height of the stamina bar
    const staminaBarX = this.x - map.xOffset;
    const staminaBarY = this.y - map.yOffset - 5; // Position above the player

    // Draw the full stamina bar
    ctx.fillStyle = "rgb(150, 120, 70)";
    drawRoundedRect(
      ctx,
      staminaBarX,
      staminaBarY,
      staminaBarWidth,
      staminaBarHeight,
      cornerRadius
    );

    // Draw current stamina
    ctx.fillStyle = "rgb(250, 200, 40)";
    const currentStaminaWidth =
      (this.stamina / this.maxStamina) * staminaBarWidth;
    drawRoundedRect(
      ctx,
      staminaBarX,
      staminaBarY,
      currentStaminaWidth,
      staminaBarHeight,
      cornerRadius
    );

    // Draw projectiles
    this.projectiles.forEach((projectile) => projectile.draw(ctx, map));
  }

  emitObject(direction) {
    const currentTime = performance.now();
    if (currentTime - this.lastEmitTime > this.currentProjectile.emitCooldown) {
      if (
        this.currentProjectile.type === "ranged" &&
        this.currentProjectile.remainingAmmo
      ) {
        this.lastEmitTime = currentTime;
        this.currentProjectile.remainingAmmo -= 1;

        // Calculate the angle in radians
        const angle = Math.atan2(direction.y, direction.x);

        // Calculate the player's circle radius
        const thirdOfPlayerDiameter = this.width / 3;

        // Calculate the projectile's radius
        const projectileRadius = this.currentProjectile.size / 2;

        // Determine origin based on direction
        const centerX = this.x + this.width / 2; // Center x
        const centerY = this.y + this.height / 2; // Center y

        // Compute the edge position based on direction and player's radius
        const startX = centerX + thirdOfPlayerDiameter * Math.cos(angle);
        const startY = centerY + thirdOfPlayerDiameter * Math.sin(angle);

        return new Projectile(startX, startY, angle, this.currentProjectile);
      } else if (this.currentProjectile.type === "melee") {
        this.lastEmitTime = currentTime;

        // Calculate the angle in radians
        const angle = Math.atan2(direction.y, direction.x);

        // Calculate the player's circle radius
        const thirdOfPlayerDiameter = this.width / 3;

        // Determine origin based on direction
        const centerX = this.x + this.width / 2; // Center x
        const centerY = this.y + this.height / 2; // Center y

        // Compute the edge position based on direction and player's radius
        const startX = centerX + thirdOfPlayerDiameter * Math.cos(angle);
        const startY = centerY + thirdOfPlayerDiameter * Math.sin(angle);

        return new MeleeSwing(startX, startY, angle, this.currentProjectile);
      }
    }
    return null;
  }
}
