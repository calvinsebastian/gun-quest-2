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
