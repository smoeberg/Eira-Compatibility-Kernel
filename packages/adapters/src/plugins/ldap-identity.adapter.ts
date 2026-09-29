import { BACKEND_IDS } from "@eck/translation";
import {
  AdapterNotImplementedError,
  type AdapterContext,
  type AdapterHealth,
  type IIdentityAdapter,
} from "../contracts";

function notImplemented(method: string): never {
  throw new AdapterNotImplementedError(BACKEND_IDS.LDAP, method);
}

export class LdapIdentityAdapter implements IIdentityAdapter {
  readonly pluginId = BACKEND_IDS.LDAP;
  readonly domain = "identity" as const;

  async health(_ctx: AdapterContext): Promise<AdapterHealth> {
    return { ok: false, message: "Not connected" };
  }

  async getUser(_ctx: AdapterContext, _id: string) {
    return notImplemented("getUser");
  }

  async listUsers(_ctx: AdapterContext) {
    return notImplemented("listUsers");
  }

  async createUser(_ctx: AdapterContext, _payload: unknown) {
    return notImplemented("createUser");
  }

  async updateUser(_ctx: AdapterContext, _id: string, _patch: unknown) {
    return notImplemented("updateUser");
  }

  async deleteUser(_ctx: AdapterContext, _id: string) {
    return notImplemented("deleteUser");
  }

  async getGroup(_ctx: AdapterContext, _id: string) {
    return notImplemented("getGroup");
  }

  async listGroupMembers(_ctx: AdapterContext, _groupId: string) {
    return notImplemented("listGroupMembers");
  }

  async getIdentity(_ctx: AdapterContext, _id: string) {
    return notImplemented("getIdentity");
  }

  async createIdentity(_ctx: AdapterContext, _payload: unknown) {
    return notImplemented("createIdentity");
  }
}
