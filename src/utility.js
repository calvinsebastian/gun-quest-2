export function generateUUID() {
  // Generate a random 8-digit hexadecimal number
  const randomPart = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);

  // Format and return the UUID
  return `${randomPart()}-${randomPart()}-${randomPart()}-${randomPart()}`;
}
