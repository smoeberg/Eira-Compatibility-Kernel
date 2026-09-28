const METADATA_METHODS = new Set(["OPTIONS", "HEAD"]);
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const LOCK_PATH_HINTS = ["/lock", "/checkout", "/checkin"];
const TOKEN_PATH_HINTS = ["/token", "/oauth", "/auth"];

export function getWeight(method: string, path: string): number {
  const upperMethod = method.toUpperCase();
  const lowerPath = path.toLowerCase();

  if (METADATA_METHODS.has(upperMethod)) {
    return 0.2;
  }

  if (
    LOCK_PATH_HINTS.some((hint) => lowerPath.includes(hint)) ||
    TOKEN_PATH_HINTS.some((hint) => lowerPath.includes(hint))
  ) {
    return 1.0;
  }

  if (WRITE_METHODS.has(upperMethod)) {
    return 1.0;
  }

  if (upperMethod === "GET") {
    return 0.5;
  }

  return 0.5;
}
