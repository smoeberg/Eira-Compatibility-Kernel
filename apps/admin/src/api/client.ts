const KEY = "eck_admin_api_key";

/** Simply production: VITE_ECK_AUTH_MODE=proxy — OIDC session via BFF */
export function isProxyAuthMode(): boolean {
  return import.meta.env.VITE_ECK_AUTH_MODE === "proxy";
}

export function usesSessionAuth(): boolean {
  return isProxyAuthMode();
}

export function getAdminKey(): string {
  return localStorage.getItem(KEY) ?? "";
}

export function setAdminKey(key: string): void {
  localStorage.setItem(KEY, key);
}

export function clearAdminKey(): void {
  localStorage.removeItem(KEY);
}

export interface AuthMeResponse {
  authenticated: boolean;
  user: { sub: string; email: string | null; name?: string | null } | null;
}

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  const res = await fetch("/auth/me", { credentials: "include" });
  if (!res.ok) {
    return { authenticated: false, user: null };
  }
  return res.json() as Promise<AuthMeResponse>;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  legacyBaseUrl: string;
  contactEmail: string | null;
  proxyUrl: string;
  createdAt: string;
}

export interface FingerprintRun {
  id: string;
  tenantId: string;
  startedAt: string;
  endsAt: string;
  status: string;
  mirrorPercent: number;
  daysRemaining: number;
}

export type SetupStatus = "draft" | "ready" | "awaiting_traffic" | "trial" | "active" |
  "passthrough_only" | "rollback_pending" | "closed" | "incident" | "unsupported";
export interface IntegrationSetup {
  id: string;
  tenantId: string;
  name: string;
  environment: "test" | "production";
  status: SetupStatus;
  proxyUrl: string;
  upstreamUrl: string;
  trialEndsAt?: string;
  recordingEndsAt?: string;
  firstSuccessfulCallAt?: string;
  lastProxyCallAt?: string;
  observedCalls: number;
  successfulCalls: number;
  customerConfirmed: boolean;
  rollbackConfirmedAt?: string;
  reason?: string;
}

export type SetupTransition =
  | { type: "mark_ready"; preflightConfirmed: true }
  | { type: "mark_unsupported"; reason: string }
  | { type: "configuration_saved" }
  | { type: "confirm_trial"; customerSawExpectedResult: true }
  | { type: "start_recording"; durationDays: number }
  | { type: "stop_recording" }
  | { type: "begin_rollback" }
  | { type: "confirm_rollback"; directCallSucceeded: true; customerRestoredUrl: true }
  | { type: "incident"; reason: string };

export interface SetupPayload {
  proxyUrl: string;
  legacyUrl: string;
  runId: string;
  tenantId: string;
  slug: string;
  endsAt: string;
  daysRemaining: number;
  status: string;
  instructions: string[];
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const key = getAdminKey();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (usesSessionAuth()) {
    headers["X-Request-Id"] = crypto.randomUUID();
  }
  // Simply BFF: proxy adds X-Admin-Api-Key server-side — never in browser
  if (key) {
    headers["X-Admin-Api-Key"] = key;
  }

  const res = await fetch(path, {
    ...init,
    headers,
    credentials: usesSessionAuth() ? "include" : "same-origin",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export interface CompatibilityReportDocument {
  schemaVersion: "1.0";
  reportId: string;
  runId: string;
  tenantId: string;
  tenant: { slug: string; name: string };
  generatedAt: string;
  observation: {
    startedAt: string;
    endsAt: string;
    durationDays: number;
    callCount: number;
    uniqueEndpoints: number;
  };
  score: {
    totalPercent: number;
    recommendation: "green" | "yellow" | "red";
    recommendationLabel: string;
    byCategory: Record<
      string,
      { score: number; calls: number; native: number; emulated: number; gap: number }
    >;
    matrixVersion: string;
  };
  gaps: Array<{
    method: string;
    path: string;
    normalizedPath: string;
    category: string;
    support: string;
    callCount: number;
  }>;
  topEndpoints: Array<{
    method: string;
    path: string;
    normalizedPath: string;
    category: string;
    support: string;
    callCount: number;
  }>;
  disclaimers: {
    status: string;
    primary: string;
    secondary: string;
  };
  metadata: { product: string; phase: string; locale: string };
}

export interface CompatibilityReportResponse {
  schemaVersion: "1.0";
  report: CompatibilityReportDocument;
}

export const eckApi = {
  listIntegrations: (tenantId: string) => api<IntegrationSetup[]>(`/api/v1/tenants/${tenantId}/integrations`),
  createIntegration: (tenantId: string, body: { name: string; environment: "test" | "production"; upstreamUrl: string }) =>
    api<IntegrationSetup>(`/api/v1/tenants/${tenantId}/integrations`, { method: "POST", body: JSON.stringify(body) }),
  transitionIntegration: (tenantId: string, id: string, event: SetupTransition) =>
    api<IntegrationSetup>(`/api/v1/tenants/${tenantId}/integrations/${id}/transitions`, { method: "POST", body: JSON.stringify(event) }),
  listTenants: () => api<Tenant[]>("/api/v1/tenants"),
  createTenant: (body: {
    slug: string;
    name: string;
    legacyBaseUrl: string;
    contactEmail?: string;
  }) => api<Tenant>("/api/v1/tenants", { method: "POST", body: JSON.stringify(body) }),
  getTenant: (id: string) => api<Tenant>(`/api/v1/tenants/${id}`),
  startRun: (tenantId: string) =>
    api<FingerprintRun>(`/api/v1/tenants/${tenantId}/runs`, { method: "POST" }),
  listRuns: (tenantId: string) =>
    api<FingerprintRun[]>(`/api/v1/tenants/${tenantId}/runs`),
  getSetup: (runId: string) => api<SetupPayload>(`/api/v1/runs/${runId}/setup`),
  getActiveSetup: (tenantId: string) =>
    api<{ tenant: Tenant; activeRun: FingerprintRun | null; setup: SetupPayload | null }>(
      `/api/v1/tenants/${tenantId}/runs/active/setup`,
    ),
  completeRun: (runId: string) =>
    api<CompatibilityReportResponse>(`/api/v1/runs/${runId}/complete`, {
      method: "POST",
    }),
  getReport: (runId: string) =>
    api<CompatibilityReportResponse>(`/api/v1/runs/${runId}/report`),
};
