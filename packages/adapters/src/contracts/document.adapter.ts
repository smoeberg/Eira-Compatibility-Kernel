import type { CanonicalId } from "@eck/translation";
import type { AdapterContext, AdapterPlugin } from "./base";

/** Document collaboration — Collabora WOPI. Depends on IStorageAdapter for file bytes. */
export interface IDocumentAdapter extends AdapterPlugin {
  readonly domain: "document";
  getEditUrl(ctx: AdapterContext, fileId: CanonicalId): Promise<string>;
  checkFileInfo(
    ctx: AdapterContext,
    fileId: CanonicalId,
  ): Promise<{ name: string; sizeBytes: number; version: string }>;
}

export const DOCUMENT_ADAPTER = Symbol("IDocumentAdapter");
