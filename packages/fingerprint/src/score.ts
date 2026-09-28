import matrixV0 from "./capability-matrix.v0.json";
import { classifyPath, normalizePath } from "./classifier";
import type {
  CapabilityMatrix,
  CategoryScore,
  LogEntry,
  ScoreResult,
  SupportLevel,
} from "./types";
import { SUPPORT_FACTORS } from "./types";
import { getWeight } from "./weights";

export function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .split("/")
    .map((part) => {
      if (part.startsWith("{") && part.endsWith("}")) {
        return "[^/]+";
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  return new RegExp(`^${escaped}$`);
}

export function loadCapabilityMatrix(
  matrix: CapabilityMatrix = matrixV0 as CapabilityMatrix,
): CapabilityMatrix {
  return matrix;
}

export function checkSupport(
  path: string,
  method: string,
  matrix: CapabilityMatrix,
): SupportLevel {
  const normalized = normalizePath(path);
  const upperMethod = method.toUpperCase();

  for (const route of matrix.routes) {
    if (!patternToRegex(route.pattern).test(normalized)) {
      continue;
    }
    const level = route.methods[upperMethod] ?? route.methods["*"];
    if (level) {
      return level;
    }
  }

  return "gap";
}

function emptyCategoryScore(): CategoryScore {
  return { score: 0, calls: 0, native: 0, emulated: 0, gap: 0 };
}

function recommendationFromPercent(percent: number): ScoreResult["recommendation"] {
  if (percent >= 90) return "green";
  if (percent >= 70) return "yellow";
  return "red";
}

export function calculateCompatibilityScore(
  logs: LogEntry[],
  matrix: CapabilityMatrix = loadCapabilityMatrix(),
): ScoreResult {
  let totalScore = 0;
  let maxPossible = 0;

  const byCategory: Record<string, CategoryScore> = {};

  for (const call of logs) {
    const category = call.category ?? classifyPath(call.path);
    if (!byCategory[category]) {
      byCategory[category] = emptyCategoryScore();
    }

    const weight = getWeight(call.method, call.path);
    maxPossible += weight;

    const support = checkSupport(call.path, call.method, matrix);
    const factor = SUPPORT_FACTORS[support];
    totalScore += weight * factor;

    const cat = byCategory[category];
    cat.calls += 1;
    if (support === "native") cat.native += 1;
    else if (support === "emulated") cat.emulated += 1;
    else cat.gap += 1;
  }

  const percent = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;

  for (const [category, stats] of Object.entries(byCategory)) {
    const categoryLogs = logs.filter(
      (l) => (l.category ?? classifyPath(l.path)) === category,
    );
    let catTotal = 0;
    let catMax = 0;
    for (const call of categoryLogs) {
      const weight = getWeight(call.method, call.path);
      catMax += weight;
      const support = checkSupport(call.path, call.method, matrix);
      catTotal += weight * SUPPORT_FACTORS[support];
    }
    stats.score = catMax > 0 ? (catTotal / catMax) * 100 : 0;
    byCategory[category] = stats;
  }

  return {
    percent: Math.round(percent * 100) / 100,
    recommendation: recommendationFromPercent(percent),
    byCategory,
  };
}

export function aggregateByCategory(
  logs: LogEntry[],
  matrix: CapabilityMatrix,
): Record<string, CategoryScore> {
  return calculateCompatibilityScore(logs, matrix).byCategory;
}
