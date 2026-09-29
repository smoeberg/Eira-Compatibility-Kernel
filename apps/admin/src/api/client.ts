const KEY = "eck_admin_api_key";

/** Simply production: VITE_ECK_AUTH_MODE=proxy — OIDC session via BFF */
export function isProxyAuthMode(): boolean {
  return import.meta.env.VITE_ECK_AUTH_MODE === "proxy";
}

export function usesSessionAuth(): boolean {
  return isProxyAuthMode();
}

export function getAdminKey(): string {
  return usesSessionAuth() ? "" : sessionStorage.getItem(KEY) ?? "";
}

export function setAdminKey(key: string): void {
  if (!usesSessionAuth()) sessionStorage.setItem(KEY, key);
}

export function clearAdminKey(): void {
  sessionStorage.removeItem(KEY);
  localStorage.removeItem(KEY); // clear keys saved by older admin builds
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
    let message = "Anmodningen kunne ikke gennemføres.";
    try {
      const body = await res.json() as { message?: string | string[] };
      if (body.message) message = Array.isArray(body.message) ? body.message.join(" ") : body.message;
    } catch { /* Do not expose an HTML error page or stack trace in the UI. */ }
    if (res.status === 409) message = `Handlingen er ikke tilladt i den nuværende tilstand. ${message}`;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const eckApi = {
  listIntegrations: (tenantId: string) => api<IntegrationSetup[]>(`/api/v1/tenants/${tenantId}/integrations`),
  getIntegration: (tenantId: string, id: string) =>
    api<IntegrationSetup>(`/api/v1/tenants/${tenantId}/integrations/${id}`),
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
};
