export * from "./contracts";
export { AdapterPluginRegistry } from "./registry";

export { NextcloudStorageAdapter } from "./plugins/nextcloud-storage.adapter";
export { OwnCloudStorageAdapter } from "./plugins/owncloud-storage.adapter";
export { S3StorageAdapter } from "./plugins/s3-storage.adapter";
export { LdapIdentityAdapter } from "./plugins/ldap-identity.adapter";

import { AdapterPluginRegistry } from "./registry";
import { LdapIdentityAdapter } from "./plugins/ldap-identity.adapter";
import { NextcloudStorageAdapter } from "./plugins/nextcloud-storage.adapter";
import { OwnCloudStorageAdapter } from "./plugins/owncloud-storage.adapter";
import { S3StorageAdapter } from "./plugins/s3-storage.adapter";

/** Register stub plugins for local dev — production loads configured backends only. */
export function registerDefaultPlugins(registry: AdapterPluginRegistry): void {
  registry.registerStorage(new NextcloudStorageAdapter());
  registry.registerStorage(new OwnCloudStorageAdapter());
  registry.registerStorage(new S3StorageAdapter());
  registry.registerIdentity(new LdapIdentityAdapter());
}
