import { patternToRegex } from "@eck/fingerprint";
import type { PlatformId } from "./canonical";
import type { PlatformMapperRegistry, PlatformRouteMapper } from "./platform/mapper";

export class InMemoryPlatformMapperRegistry implements PlatformMapperRegistry {
  private readonly mappers: PlatformRouteMapper[] = [];

  register(mapper: PlatformRouteMapper): void {
    this.mappers.push(mapper);
  }

  resolve(
    platformId: PlatformId,
    method: string,
    path: string,
  ): PlatformRouteMapper | null {
    const normalized = path.split("?")[0] ?? path;
    const upper = method.toUpperCase();

    for (const m of this.mappers) {
      if (m.platformId !== platformId) continue;
      if (!m.methods.includes(upper) && !m.methods.includes("*")) continue;
      if (patternToRegex(m.pattern).test(normalized)) {
        return m;
      }
    }
    return null;
  }
}
