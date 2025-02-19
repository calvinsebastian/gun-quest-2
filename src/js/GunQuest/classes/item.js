import { playSound } from "./playAudio.js";
import { easyToggle, lit, setAlert } from "../GunQuest.js";

export class Item {
  constructor(x, y, parentElement, type) {
    this.element = document.createElement("div");
    this.element.className = "item";
    parentElement.appendChild(this.element);
    this.x = x;
    this.y = y;
    this.sprite = new Image();
    this.sprite.src = type.sprite;
    this.spriteLoaded = false;
    this.sound = type.sound;
    this.soundVolume = type.soundVolume;

    this.sprite.onload = () => {
      this.spriteLoaded = true;
    };

    this.name = type.name;
    this.subject = type.subject;
    this.type = type.type;
    this.stat = type.stat;
    this.maxStat = type.maxStat;
    this.value = type.value;
    this.color = type.color;
    this.height = type.height;
    this.width = type.width;
    this.timer = 0;
    this.isBlinking = false;
    this.blinkTime = 0;

    // Animation settings
    this.amplitude = 2; // Amplitude for floating effect
    this.frequency = 0.005; // Frequency for floating effect
    this.baseY = this.y; // To keep track of the base Y position
  }

  checkCollision(other) {
    // Assuming 'this' is a rectangle
    const rect = {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };

    // Assuming 'other' is a circle
    const circle = {
      x: other.x + other.width / 2,
      y: other.y + other.height / 2,
      radius: Math.min(other.width, other.height) / 2, // Radius of the circle
    };

    // Find the closest point on the rectangle to the circle
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

    // Calculate the distance between the circle's center and this closest point
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const distanceSquared = dx * dx + dy * dy;

    // Check if the distance is less than the circle's radius
    return distanceSquared < circle.radius * circle.radius;
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
    }
  }

  update(player, items, deltaTime) {
    this.timer += deltaTime;
    if (this.isBlinking) {
      this.blinkTime += deltaTime;
      if (this.blinkTime <= 0) {
        this.isBlinking = false;
      }
    }
    const collided = this.checkCollision(player);
    if (collided) {
      const index = items.indexOf(this);
      if (index > -1) {
        items.splice(index, 1);
      }
      playSound(this.sound, this.soundVolume);
      this.applyItem(player);
    }
    if (this.timer > 20) {
      this.destroy();
      const index = items.indexOf(this);
      if (index > -1) {
        items.splice(index, 1);
      }
    }
  }

  applyItem(player) {
    const itemAchievement = player.itemAchievements.find(
      (item) => item.name === this.name
    );
    itemAchievement.count += 1;
    if (this.subject === "player") {
      if (this.type === "replenish") {
        // if (this.name === "Moldy Corn" && !itemAchievement.achieved) {
        //   return;
        // }

        player[this.stat] + this.value < player[this.maxStat]
          ? (player[this.stat] = player[this.stat] + this.value)
          : (player[this.stat] = player[this.maxStat])
          ? (player.score += this.value)
          : (player[this.stat] = player[this.maxStat]);
        // setAlert(`${this.name}!? You eat it anyways.`, player);
      } else if (this.type === "collectible") {
        player[this.stat] += this.value;
      } else if (this.type === "global") {
        //handle globals individually
        if (this.name === "Lantern") {
          if (player.isLit) {
            player.timeSinceLit = 0;
          } else {
            player.isLit = true;
          }
        }
      }
    } else if (this.subject === "projectile") {
      if (this.type === "replenish") {
        const availableProjectiles = player.acquiredProjectiles.filter(
          (projectile) =>
            projectile.remainingAmmo < projectile.maxAmmo &&
            projectile.type === "ranged"
        );
        let affectedProjectile;
        if (availableProjectiles.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * availableProjectiles.length
          );
          affectedProjectile = availableProjectiles[randomIndex];
          affectedProjectile[this.stat] =
            affectedProjectile[this.stat] + this.value <
            affectedProjectile[this.maxStat]
              ? affectedProjectile[this.stat] + this.value
              : affectedProjectile[this.maxStat];
          if (!easyToggle.checked)
            setAlert(
              {
                text: `You found some ${affectedProjectile.name} ${this.name}!`,
                font: "11px 'Press Start 2P'",
                color: "gray",
              },
              player
            );
        } else {
          player.score += this.value;
        }
      }
    }
  }

  draw(ctx, map) {
    if (this.timer > 15) {
      this.isBlinking = true;

      if (this.isBlinking && this.blinkTime % 0.1 < 0.05) {
        return; // Skip drawing during blink effect
      }
    }

    if (this.element) {
      const floatingY =
        this.amplitude * Math.sin(this.frequency * Date.now()) + this.baseY;

      if (this.sprite) {
        if (this.spriteLoaded) {
          // Draw sprite
          ctx.drawImage(
            this.sprite,
            this.x - map.xOffset,
            floatingY - map.yOffset,
            this.width,
            this.height
          );
        }
      } else {
        ctx.fillStyle = this.color;
        ctx.save();
        // Adjusting the position for floating effect and alignment with map offset
        const rectX = this.x - map.xOffset;
        const rectY = this.y - map.yOffset;
        const rectWidth = this.width;
        const rectHeight = this.height;

        // Draw the rectangle
        ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
        ctx.restore();
      }
    }
  }
}
