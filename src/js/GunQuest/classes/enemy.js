import { playSound } from "./playAudio.js";
import { mouse } from "../js/input.js";

export class Enemy {
  constructor(x, y, parentElement, type) {
    this.element = document.createElement("div");
    parentElement.appendChild(this.element);
    this.element.className = "enemy";
    this.image = type?.image;
    this.x = x;
    this.y = y;
    this.id = type.id;
    this.width = type.width;
    this.height = type.height;
    this.color = type.color;
    this.glowColor = type.glowColor;
    this.health = type.health;
    this.speed = type.speed;
    this.damage = type.damage;
    this.knockbackForce = type.knockbackForce;
    this.aggroDistance = type.aggroDistance;
    this.isAggroed = true; // if this is true they are alway aggresive and heading to towards player
    this.value = type.value;
    this.direction = Math.random() * 2 * Math.PI; // Random initial direction in radians
    this.moveTime = Math.random() * 3 + 1; // Random time to move in the current direction
    this.moveTimer = 0; // Timer to manage direction change
    this.isBlinking = false;
    this.blinkTime = 0;
    this.knockback = { x: 0, y: 0 };
    this.isImageLoaded = false;
    if (type.sprite) {
      this.sprite = new Image();
      this.sprite.src = type.sprite;
      this.sprite.onload = () => {
        this.isImageLoaded = true;
        // Handle the case where the sprite is loaded
      };
      this.sprite.onerror = (e) => {
        console.error("Image failed to load:", e);
      };
    }
  }

  destroy() {
    // Cleanup tasks

    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
    }
  }

  update(player, enemies, deltaTime, map) {
    // Apply knockback if present
    if (this.knockback.x !== 0 || this.knockback.y !== 0) {
      this.x += this.knockback.x * deltaTime;
      this.y += this.knockback.y * deltaTime;

      // Apply friction to knockback
      this.knockback.x *= 0.9; // Adjust friction as necessary
      this.knockback.y *= 0.9; // Adjust friction as necessary

      // Reset knockback if it's below a threshold
      if (Math.abs(this.knockback.x) < 0.1) this.knockback.x = 0;
      if (Math.abs(this.knockback.y) < 0.1) this.knockback.y = 0;
    }

    const cellWidth = 100; // Width of a single cell in the map
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.aggroDistance || this.isAggroed) {
      this.isAggroed = true;
      // Move towards player
      const angle = Math.atan2(dy, dx); // Angle to player
      this.x += Math.cos(angle) * this.speed * deltaTime;
      this.y += Math.sin(angle) * this.speed * deltaTime;
    } else {
      // Check if the enemy should change direction
      if (this.moveTimer <= 0) {
        this.changeDirection();
        this.moveTimer = Math.random() * 4 + 1; // Random time to move in the current direction
      }

      // Check for collisions before moving
      if (
        this.willCollideWithWall(map) ||
        this.willCollideWithEnemies(enemies)
      ) {
        this.changeDirection(); // Change direction if collision detected
      }

      if (this.direction !== null) {
        this.x += Math.cos(this.direction) * this.speed * deltaTime;
        this.y += Math.sin(this.direction) * this.speed * deltaTime;
      }

      this.moveTimer -= deltaTime;
    }

    // Handle blinking effect
    if (this.isBlinking) {
      this.blinkTime -= deltaTime;
      if (this.blinkTime <= 0) {
        this.isBlinking = false;
      }
    }

    // Check for collisions with player
    if (this.checkCollision(player)) {
      this.handleCollision(player);
      this.resolveCollision(player); // Resolve the collision to prevent passing through
    }

    // Check for collisions with other enemies
    enemies.forEach((otherEnemy) => {
      if (otherEnemy !== this && this.checkCollision(otherEnemy)) {
        this.resolveEnemyCollision(otherEnemy);
      }
    });

    this.x = Math.max(
      cellWidth,
      Math.min(this.x, map.width - this.width - cellWidth)
    );
    this.y = Math.max(
      cellWidth,
      Math.min(this.y, map.height - this.height - cellWidth)
    );
  }

  draw(ctx, map, player) {
    if (this.element) {
      if (this.isBlinking && this.blinkTime % 0.1 < 0.05) {
        return; // Skip drawing during blink effect
      }

      const centerX = this.x + this.width / 2 - map.xOffset;
      const centerY = this.y + this.height / 2 - map.yOffset;
      const playerY = player.y - map.yOffset;
      const playerX = player.x - map.xOffset;
      const angle = Math.atan2(playerY - centerY, playerX - centerX);

      ctx.save();

      if (this.isImageLoaded && this.sprite) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.glowColor;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        ctx.drawImage(
          this.sprite,
          -this.width / 2,
          -this.height / 2,
          this.width,
          this.height
        );
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
      } else {
        // Drawing fallback if the image isn't loaded
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.glowColor;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        const radius = this.width / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
      }

      ctx.restore();
    }
  }

  changeDirection() {
    // Choose a new direction: 0=up, 1=down, 2=left, 3=right, 4=stay still
    const directionChoice = Math.floor(Math.random() * 5);
    switch (directionChoice) {
      case 0: // Up
        this.direction = -Math.PI / 2;
        break;
      case 1: // Down
        this.direction = Math.PI / 2;
        break;
      case 2: // Left
        this.direction = Math.PI;
        break;
      case 3: // Right
        this.direction = 0;
        break;
      case 4: // Stay still
        this.direction = null;
        break;
    }
  }

  willCollideWithWall(map) {
    const futureX = this.x + Math.cos(this.direction) * this.speed;
    const futureY = this.y + Math.sin(this.direction) * this.speed;

    return (
      futureX < 100 ||
      futureX > map.width - this.width - 100 ||
      futureY < 100 ||
      futureY > map.height - this.height - 100
    );
  }

  willCollideWithEnemies(enemies) {
    return enemies.some(
      (otherEnemy) => otherEnemy !== this && this.checkCollision(otherEnemy)
    );
  }

  checkCollision(other) {
    // Calculate the radius for this and other object
    const radiusA = Math.min(this.width, this.height) / 2; // Assuming this is a circle
    const radiusB = Math.min(other.width, other.height) / 2; // Assuming other is a circle

    // Calculate the center points of both circles
    const centerX1 = this.x + radiusA;
    const centerY1 = this.y + radiusA;
    const centerX2 = other.x + radiusB;
    const centerY2 = other.y + radiusB;

    // Calculate the distance between the two centers
    const dx = centerX1 - centerX2;
    const dy = centerY1 - centerY2;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if the distance is less than the sum of the radii
    return distance < radiusA + radiusB;
  }

  handleCollision(player) {
    playSound("./assets/audio/effects/hit.wav", 0.5);
    if (!player.isBlinking) {
      player.isBlinking = true;
      player.blinkTime = 1.0; // Blink duration
      player.health -= this.damage; // Example health reduction
    }

    // Calculate knockback direction
    const angle = Math.atan2(player.y - this.y, player.x - this.x);

    // Apply knockback to player
    player.knockback.x = Math.cos(angle) * this.knockbackForce;
    player.knockback.y = Math.sin(angle) * this.knockbackForce;

    // Apply knockback to enemy
    this.knockback.x = -Math.cos(angle) * player.knockbackForce;
    this.knockback.y = -Math.sin(angle) * player.knockbackForce;
  }

  resolveCollision(player) {
    const overlapX = Math.min(
      player.x + player.width - this.x,
      this.x + this.width - player.x
    );
    const overlapY = Math.min(
      player.y + player.height - this.y,
      this.y + this.height - player.y
    );

    if (overlapX < overlapY) {
      // Horizontal collision
      const moveAmount = overlapX / 2;
      if (player.x < this.x) {
        player.x -= moveAmount;
        this.x += moveAmount;
      } else {
        player.x += moveAmount;
        this.x -= moveAmount;
      }
    } else {
      // Vertical collision
      const moveAmount = overlapY / 2;
      if (player.y < this.y) {
        player.y -= moveAmount;
        this.y += moveAmount;
      } else {
        player.y += moveAmount;
        this.y -= moveAmount;
      }
    }

    // Ensure health doesn't drop below 0
    player.health = Math.max(player.health - 10, 0);
  }

  resolveEnemyCollision(other) {
    const overlapX = Math.min(
      this.x + this.width - other.x,
      other.x + other.width - this.x
    );
    const overlapY = Math.min(
      this.y + this.height - other.y,
      other.y + other.height - this.y
    );

    if (overlapX < overlapY) {
      // Horizontal collision
      if (this.x < other.x) {
        this.x -= overlapX / 2;
        other.x += overlapX / 2;
      } else {
        this.x += overlapX / 2;
        other.x -= overlapX / 2;
      }
    } else {
      // Vertical collision
      if (this.y < other.y) {
        this.y -= overlapY / 2;
        other.y += overlapY / 2;
      } else {
        this.y += overlapY / 2;
        other.y -= overlapY / 2;
      }
    }
  }
}
