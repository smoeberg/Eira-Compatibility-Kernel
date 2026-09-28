import { patternToRegex } from "@eck/fingerprint";
import type { RouteMapper, TranslationRegistry } from "./mapper";

export class InMemoryTranslationRegistry implements TranslationRegistry {
  private readonly mappers: RouteMapper[] = [];

  register(mapper: RouteMapper): void {
    this.mappers.push(mapper);
  }

  resolve(method: string, path: string): RouteMapper | null {
    const normalized = path.split("?")[0] ?? path;
    const upper = method.toUpperCase();

    for (const m of this.mappers) {
      if (!m.methods.includes(upper) && !m.methods.includes("*")) {
        continue;
      }
      if (patternToRegex(m.pattern).test(normalized)) {
        return m;
      }
    }
    return null;
  }
}
