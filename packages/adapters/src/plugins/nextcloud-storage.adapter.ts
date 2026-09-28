import { BACKEND_IDS } from "@eck/translation";
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
  readonly pluginId = BACKEND_IDS.NEXTCLOUD;
  readonly domain = "storage" as const;

  async health(_ctx: AdapterContext): Promise<AdapterHealth> {
    return { ok: false, message: "Not connected" };
  }

  async getItem(_ctx: AdapterContext, _id: string) {
    notImplemented("getItem");
  }

  async listChildren(_ctx: AdapterContext, _parentId?: string) {
    notImplemented("listChildren");
  }

  async createItem(_ctx: AdapterContext, _payload: unknown) {
    notImplemented("createItem");
  }

  async updateItem(_ctx: AdapterContext, _id: string, _patch: unknown) {
    notImplemented("updateItem");
  }

  async deleteItem(_ctx: AdapterContext, _id: string) {
    notImplemented("deleteItem");
  }

  async getContent(_ctx: AdapterContext, _id: string) {
    notImplemented("getContent");
  }

  async putContent(_ctx: AdapterContext, _id: string, _content: Uint8Array) {
    notImplemented("putContent");
  }
}
