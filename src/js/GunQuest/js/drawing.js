export function drawRoundedRect(ctx, x, y, width, height, radius) {
  if (width === 0) return;
  ctx.beginPath();

  // Top-left corner
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arc(x + width - radius, y + radius, radius, -Math.PI / 2, 0);

  // Top-right corner
  ctx.lineTo(x + width, y + height - radius);
  ctx.arc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2);

  // Bottom-right corner
  ctx.lineTo(x + radius, y + height);
  ctx.arc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI);

  // Bottom-left corner
  ctx.lineTo(x, y + radius);
  ctx.arc(x + radius, y + radius, radius, Math.PI, -Math.PI / 2);

  ctx.closePath();
  ctx.fill();
}
