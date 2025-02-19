export function generateUUID() {
  // Generate a random 8-digit hexadecimal number
  const randomPart = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);

  // Format and return the UUID
  return `${randomPart()}-${randomPart()}-${randomPart()}-${randomPart()}`;
}

export function generateEnemyPosition() {
  // Array of possible values for x and z
  const possiblePositions = [-30, -20, 20, 30];

  // Pick a random value from the array for x and z
  const x =
    possiblePositions[Math.floor(Math.random() * possiblePositions.length)];
  const z =
    possiblePositions[Math.floor(Math.random() * possiblePositions.length)];

  // Set a fixed value for y as 1 (or another value based on your game world)
  const y = 1;

  // Return the position as an object
  return { x: x, y: y, z: z };
}

export function getMapPosition(x, y) {
  // Define the scale factor for the transformation
  const scale = 2.4;

  // Map the x and y values to the desired range
  const xPosition = (x - 0) * scale - 44.4;
  const yPosition = (y - 0) * scale - 44.4;

  // Ensure that the maximum values do not exceed the target range
  const maxPosition = 44.4;
  const minPosition = -44.4;

  // Clamp the values to the min/max range to prevent overflow
  const clampedX = Math.max(minPosition, Math.min(xPosition, maxPosition));
  const clampedY = Math.max(minPosition, Math.min(yPosition, maxPosition));

  // Return the translated position
  return { x: clampedX, y: 1.2, z: clampedY }; // Assuming z is always 1
}
