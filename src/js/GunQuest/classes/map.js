export class Map {
  constructor(width, height, parentElement, pattern) {
    this.element = document.createElement("div");
    this.element.className = "map";
    parentElement.appendChild(this.element);
    this.width = width;
    this.height = height;
    this.xOffset = 0;
    this.yOffset = 0;
    this.pattern = pattern;
  }

  draw(ctx, viewport) {
    // Save the current canvas state
    ctx.save();

    // Clear the canvas
    ctx.clearRect(0, 0, viewport.width, viewport.height);

    // Draw the map
    ctx.fillStyle = this.pattern;
    ctx.translate(-this.xOffset, -this.yOffset);
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.translate(this.xOffset, this.yOffset);

    // Set up mask to create the border effect
    const borderThickness = 100;
    ctx.globalCompositeOperation = "destination-in"; // Keep only what's inside the path

    // Draw a rectangle mask to keep the map area and cut out the border
    ctx.beginPath();
    ctx.rect(
      borderThickness,
      borderThickness,
      viewport.width - 2 * borderThickness,
      viewport.height - 2 * borderThickness
    );
    ctx.fill();
    ctx.closePath();

    // Restore the canvas state
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }
}
