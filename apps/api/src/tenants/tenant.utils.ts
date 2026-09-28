const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 63);
}

export function assertValidSlug(slug: string): void {
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(
      "slug must be lowercase alphanumeric with optional hyphens (2–63 chars)",
    );
  }
}

export function assertValidLegacyUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("legacyBaseUrl must be a valid URL");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("legacyBaseUrl must use http or https");
  }
}
