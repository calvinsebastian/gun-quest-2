export class MeleeSwing {
  constructor(x, y, angle, type) {
    this.x = Number(x);
    this.y = Number(y);
    this.angle = angle; // Angle in radians
    this.speed = type.speed; // Speed of the swing (if relevant)
    this.lifespan = type.lifespan; // Lifespan in frames or time
    this.damage = type.damage;
    this.color = type.color;
    this.glowColor = type.glowColor;
    this.width = type.size; // Width of the swing
    this.height = type.size; // Height of the swing
    this.knockbackForce = type.knockbackForce;

    // Initialize the position and size of the melee swing
    this.initializeSwing();
  }

  initializeSwing() {
    // Calculate the end position based on angle and size
    const swingLength = this.width; // or some other factor if needed
    this.endX = this.x + swingLength * Math.cos(this.angle);
    this.endY = this.y + swingLength * Math.sin(this.angle);
  }

  // Add method to update the swing's state
  update() {
    // Example: Update lifespan or other properties
    this.lifespan -= 1;
  }

  pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    if (dx === 0 && dy === 0) {
      // The segment is just a single point
      const dx1 = px - x1;
      const dy1 = py - y1;
      return Math.sqrt(dx1 * dx1 + dy1 * dy1);
    }

    // Compute the projection of the point onto the line segment
    const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
    const clampedT = Math.max(0, Math.min(1, t));
    const closestX = x1 + clampedT * dx;
    const closestY = y1 + clampedT * dy;

    const dx1 = px - closestX;
    const dy1 = py - closestY;
    return Math.sqrt(dx1 * dx1 + dy1 * dy1);
  }

  checkCollision(circle, map) {
    // const x1 = this.x - map.xOffset;
    // const y1 = this.y - map.yOffset;
    // const x2 = this.endX - map.xOffset;
    // const y2 = this.endY - map.yOffset;

    const x1 = this.x;
    const y1 = this.y;
    const x2 = this.endX;
    const y2 = this.endY;

    // Circle properties
    const cx = circle.x;
    const cy = circle.y;

    // Calculate the distance from the circle's center to the line segment
    const distance = this.pointToSegmentDistance(cx, cy, x1, y1, x2, y2);

    console.log(distance, circle.width);

    // Check if the distance is less than or equal to the radius
    return distance <= circle.width;
  }

  // Add a method to render or visualize the swing
  draw(ctx, map) {
    // Save the current context state
    ctx.save();

    const centerX = this.x - map.xOffset;
    const centerY = this.y - map.yOffset;
    const endX = this.endX - map.xOffset;
    const endY = this.endY - map.yOffset;

    // Draw the glow effect first (optional)
    if (this.glowColor) {
      ctx.strokeStyle = this.glowColor;
      ctx.lineWidth = 5; // Slightly larger for glow
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    console.log(this.color, this.height, this.x, this.y, this.endX, this.endY);

    // Draw the main swing
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Restore the previous context state
    ctx.restore();
  }
}
