import PF from "pathfinding";

export function generateUUID() {
  // Generate a random 8-digit hexadecimal number
  const randomPart = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);

  // Format and return the UUID
  return `${randomPart()}-${randomPart()}-${randomPart()}-${randomPart()}`;
}

// export function generateEnemyPosition(occupiedCells, playerPosition) {
//   // Array of possible values for x and z
//   const possiblePositions = [-30, -20, 20, 30];

//   // Pick a random value from the array for x and z
//   const x =
//     possiblePositions[Math.floor(Math.random() * possiblePositions.length)];
//   const z =
//     possiblePositions[Math.floor(Math.random() * possiblePositions.length)];

//   // Set a fixed value for y as 1 (or another value based on your game world)
//   const y = 1;

//   // Return the position as an object
//   return { x: x, y: y, z: z };
// }

export function generateEnemyPosition(occupiedCells, playerPosition, round) {
  const gridSize = 20; // Adjust based on your map size
  const minDistance = 5; // Minimum grid distance from player
  const maxDistance = 16 + (round - 1); // Max distance increases as rounds go on (10 units per round)
  let spawnGridPos;
  let attempts = 0;
  console.log("attempts", attempts);
  const maxAttempts = 100; // Avoid infinite loops

  // Get the player's grid position
  const playerGridPos = getGridPosition(playerPosition.x, playerPosition.z);

  do {
    // Generate random grid position
    const gridX = Math.floor(Math.random() * gridSize);
    const gridZ = Math.floor(Math.random() * gridSize);
    spawnGridPos = { x: gridX, z: gridZ };

    // Check if the cell is occupied
    const isOccupied = occupiedCells[`${gridX},${gridZ}`];

    // Check distance from player
    const dx = gridX - playerGridPos.x;
    const dz = gridZ - playerGridPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Ensure spawn position is within the desired range
    if (!isOccupied && distance >= minDistance && distance <= maxDistance) {
      break; // Found a valid position
    }

    attempts++;
  } while (attempts < maxAttempts);

  // Convert grid position to world position
  const worldPos = getMapPosition(spawnGridPos.x, spawnGridPos.z);
  return { x: worldPos.x, y: 1, z: worldPos.z };
}

export function getMapPosition(x, z) {
  const scale = 2.4;

  // Reverse the transformation to get the center of the grid cell
  const xPosition = x * scale - 44.4;
  const zPosition = z * scale - 44.4;

  // Clamp the values to ensure they stay within the min/max range
  const maxPosition = 44.4;
  const minPosition = -44.4;

  const clampedX = Math.max(minPosition, Math.min(xPosition, maxPosition));
  const clampedZ = Math.max(minPosition, Math.min(zPosition, maxPosition));

  // Return the world position with the fixed y value (e.g., 1.2 for ground level)
  return { x: clampedX, y: 1.2, z: clampedZ };
}

export function getGridPosition(x, z) {
  const scale = 2.4;

  // Reverse the world-to-grid transformation
  const gridX = Math.round((x + 44.4) / scale);
  const gridZ = Math.round((z + 44.4) / scale);

  return { x: gridX, z: gridZ };
}

export function generateNavGrid(gridSize, occupiedCells) {
  const grid = new PF.Grid(gridSize, gridSize);

  // Mark occupied cells as unwalkable
  Object.keys(occupiedCells).forEach((key) => {
    const [x, z] = key.split(",").map(Number);
    grid.setWalkableAt(x, z, false);
  });

  return grid; // Return the pathfinding grid instead of a mesh
}
