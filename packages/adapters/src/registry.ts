import type { BackendId } from "@eck/translation";
import type { IIdentityAdapter, IStorageAdapter } from "./contracts";

/** Registry only: plugins remain unimplemented until their backends are connected. */
export class AdapterPluginRegistry {
  private readonly storage = new Map<BackendId, IStorageAdapter>();
  private readonly identity = new Map<BackendId, IIdentityAdapter>();
  registerStorage(adapter: IStorageAdapter): void { this.storage.set(adapter.pluginId, adapter); }
  registerIdentity(adapter: IIdentityAdapter): void { this.identity.set(adapter.pluginId, adapter); }
  storageAdapter(id: BackendId): IStorageAdapter | undefined { return this.storage.get(id); }
  identityAdapter(id: BackendId): IIdentityAdapter | undefined { return this.identity.get(id); }
  listRegistered(): BackendId[] { return [...new Set([...this.storage.keys(), ...this.identity.keys()])]; }
}
