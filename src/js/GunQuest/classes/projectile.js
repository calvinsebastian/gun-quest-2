export class Projectile {
  constructor(x, y, angle, type) {
    this.x = Number(x);
    this.y = Number(y);
    this.angle = angle; // Angle in radians
    this.speed = type.speed;
    this.lifespan = type.lifespan; // lifespan in frames
    this.damage = type.damage;
    this.color = type.color;
    this.glowColor = type.glowColor;
    this.width = type.size; // Width of projectile
    this.height = type.size; // Height of projectile
    this.knockbackForce = type.knockbackForce;
  }

  update(deltaTime) {
    // Update position based on angle
    this.x += Math.cos(this.angle) * this.speed * deltaTime;
    this.y += Math.sin(this.angle) * this.speed * deltaTime;

    // Decrease lifespan based on deltaTime
    this.lifespan -= 1;
  }

  // checkCollision(enemy) {
  //   // Basic collision detection based on projectile's size
  //   return (
  //     this.x < enemy.x + enemy.width &&
  //     this.x + this.width > enemy.x &&
  //     this.y < enemy.y + enemy.height &&
  //     this.y + this.height > enemy.y
  //   );
  // }

  checkCollision(enemy) {
    // Calculate the radius for this and enemy object
    const radiusA = Math.min(this.width, this.height) / 2; // Assuming this is a circle
    const radiusB = Math.min(enemy.width, enemy.height) / 2; // Assuming enemy is a circle

    // Calculate the center points of both circles
    const centerX1 = parseFloat(this.x).toFixed(2);
    const centerY1 = parseFloat(this.y).toFixed(2);
    const centerX2 = parseFloat(enemy.x + radiusB).toFixed(2);
    const centerY2 = parseFloat(enemy.y + radiusB).toFixed(2);

    // Calculate the distance between the two centers
    const dx = centerX1 - centerX2;
    const dy = centerY1 - centerY2;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if the distance is less than the sum of the radii
    return distance < radiusA + radiusB;
  }

  draw(ctx, map) {
    // Save the current canvas state
    ctx.save();

    // Set up the glow effect
    ctx.shadowBlur = 10; // Controls the blur of the glow
    ctx.shadowColor = this.glowColor; // Set the glow color, you can change this to your preferred neon color
    ctx.shadowOffsetX = 0; // Offset of the shadow on the X axis
    ctx.shadowOffsetY = 0; // Offset of the shadow on the Y axis

    ctx.fillStyle = this.color; // Set the fill color of the projectile

    // Calculate the center and radius
    const centerX = this.x - map.xOffset;
    const centerY = this.y - map.yOffset;
    const radius = this.width / 2;

    // Begin the path
    ctx.beginPath();

    // Draw the circle
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

    // Fill the circle
    ctx.fill();

    // Optionally, close the path
    ctx.closePath();

    // Restore the canvas state to remove the glow effect for other drawings
    ctx.restore();
  }
}
