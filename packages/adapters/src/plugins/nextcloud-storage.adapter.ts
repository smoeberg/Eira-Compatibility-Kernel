import { BACKEND_IDS, type BackendId } from "@eck/translation";
import {
  AdapterNotImplementedError,
  type AdapterContext,
  type AdapterHealth,
  type IStorageAdapter,
} from "../contracts";

function notImplemented(method: string): never {
  throw new AdapterNotImplementedError(BACKEND_IDS.NEXTCLOUD, method);
}

/** WebDAV / OCS — first V1 storage plugin. */
export class NextcloudStorageAdapter implements IStorageAdapter {
  readonly pluginId: BackendId = BACKEND_IDS.NEXTCLOUD;
  readonly domain = "storage" as const;

  async health(_ctx: AdapterContext): Promise<AdapterHealth> {
    return { ok: false, message: "Not connected" };
  }

  async getItem(_ctx: AdapterContext, _id: string) {
    return notImplemented("getItem");
  }

  async listChildren(_ctx: AdapterContext, _parentId?: string) {
    return notImplemented("listChildren");
  }

  async createItem(_ctx: AdapterContext, _payload: unknown) {
    return notImplemented("createItem");
  }

  async updateItem(_ctx: AdapterContext, _id: string, _patch: unknown) {
    return notImplemented("updateItem");
  }

  async deleteItem(_ctx: AdapterContext, _id: string) {
    return notImplemented("deleteItem");
  }

  async getContent(_ctx: AdapterContext, _id: string) {
    return notImplemented("getContent");
  }

  async putContent(_ctx: AdapterContext, _id: string, _content: Uint8Array) {
    return notImplemented("putContent");
  }
}
