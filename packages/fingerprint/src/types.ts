export type SupportLevel = "native" | "emulated" | "gap";

export type LogCategory =
  | "identity"
  | "files"
  | "calendar"
  | "chat_notify"
  | "other";

export interface LogEntry {
  method: string;
  path: string;
  category?: LogCategory;
}

export interface MatrixRoute {
  pattern: string;
  methods: Partial<Record<string, SupportLevel>>;
}

export interface CapabilityMatrix {
  version: string;
  routes: MatrixRoute[];
}

export interface CategoryScore {
  score: number;
  calls: number;
  native: number;
  emulated: number;
  gap: number;
}

export interface ScoreResult {
  percent: number;
  recommendation: "green" | "yellow" | "red";
  byCategory: Record<string, CategoryScore>;
}

export const SUPPORT_FACTORS: Record<SupportLevel, number> = {
  native: 1.0,
  emulated: 0.7,
  gap: 0.0,
};
