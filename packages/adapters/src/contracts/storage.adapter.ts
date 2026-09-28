import type {
  CanonicalFile,
  CanonicalFileCreate,
  CanonicalFilePatch,
  CanonicalId,
} from "@eck/translation";
import type { AdapterContext, AdapterPlugin } from "./base";

export interface IStorageAdapter extends AdapterPlugin {
  readonly domain: "storage";
  getItem(ctx: AdapterContext, id: CanonicalId): Promise<CanonicalFile>;
  listChildren(
    ctx: AdapterContext,
    parentId?: CanonicalId,
  ): Promise<CanonicalFile[]>;
  createItem(
    ctx: AdapterContext,
    payload: CanonicalFileCreate,
  ): Promise<CanonicalFile>;
  updateItem(
    ctx: AdapterContext,
    id: CanonicalId,
    patch: CanonicalFilePatch,
  ): Promise<CanonicalFile>;
  deleteItem(ctx: AdapterContext, id: CanonicalId): Promise<void>;
  getContent(ctx: AdapterContext, id: CanonicalId): Promise<Uint8Array>;
  putContent(
    ctx: AdapterContext,
    id: CanonicalId,
    content: Uint8Array,
  ): Promise<CanonicalFile>;
}

export const STORAGE_ADAPTER = Symbol("IStorageAdapter");
