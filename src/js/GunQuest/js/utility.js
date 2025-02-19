// Get random number between 2 values
export function getRandomIntInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Update item array based on item weight (weight = chance of spawning compared to other items in array)
export function createWeightedArray(items) {
  const weightedArray = [];

  items.forEach((item) => {
    for (let i = 0; i < item.weight; i++) {
      weightedArray.push(item);
    }
  });

  return weightedArray;
}

// Pick random position away from player in a radius
export function getRandomPositionOutsideRadius(
  centerX,
  centerY,
  mapWidth,
  mapHeight
) {
  const bufferFromEdge = 200;

  function generateRandomPosition() {
    return {
      x: Math.random() * (mapWidth - 2 * bufferFromEdge) + bufferFromEdge,
      y: Math.random() * (mapHeight - 2 * bufferFromEdge) + bufferFromEdge,
    };
  }

  const positions = Array.from({ length: 4 }, generateRandomPosition);
  const bestPosition = positions.reduce(
    (best, pos) => {
      const xDist = Math.abs(centerX - pos.x);
      const yDist = Math.abs(centerY - pos.y);
      return xDist + yDist > best.maxDist
        ? { pos, maxDist: xDist + yDist }
        : best;
    },
    { pos: positions[0], maxDist: 0 }
  ).pos;

  return { x: parseInt(bestPosition.x), y: parseInt(bestPosition.y) };
}
