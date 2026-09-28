import type { BackendId } from "@eck/translation";

export interface AdapterHealth {
  ok: boolean;
  latencyMs?: number;
  message?: string;
}

export interface AdapterContext {
  tenantId: string;
  requestId: string;
}

/** Base contract for all backend plugins — register without changing ECK core. */
export interface AdapterPlugin {
  readonly pluginId: BackendId;
  readonly domain: AdapterDomain;
  health(ctx: AdapterContext): Promise<AdapterHealth>;
}

export type AdapterDomain =
  | "storage"
  | "identity"
  | "calendar"
  | "mail"
  | "chat"
  | "document";

export class AdapterNotImplementedError extends Error {
  constructor(pluginId: string, method: string) {
    super(`Adapter ${pluginId}.${method} not implemented`);
    this.name = "AdapterNotImplementedError";
  }
}
