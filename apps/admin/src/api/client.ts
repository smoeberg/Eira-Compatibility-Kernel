const KEY = "eck_admin_api_key";

/** Production: VITE_ECK_AUTH_MODE=proxy — OIDC session via BFF */
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
  contactEmail: string | null;
  createdAt: string;
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
  // BFF adds service credentials server-side — never in browser
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

export const eckApi = {
  listTenants: () => api<Tenant[]>("/api/v1/tenants"),
  createTenant: (body: { slug: string; name: string; contactEmail?: string }) =>
    api<Tenant>("/api/v1/tenants", { method: "POST", body: JSON.stringify(body) }),
  getTenant: (id: string) => api<Tenant>(`/api/v1/tenants/${id}`),
};
