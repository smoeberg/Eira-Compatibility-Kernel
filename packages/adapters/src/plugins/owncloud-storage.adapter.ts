import { BACKEND_IDS, type BackendId } from "@eck/translation";
import { NextcloudStorageAdapter } from "./nextcloud-storage.adapter";

/** Contract-only stub. An OwnCloud backend must supply its own implementation. */
export class OwnCloudStorageAdapter extends NextcloudStorageAdapter {
  override readonly pluginId: BackendId = BACKEND_IDS.OWNCLOUD;
}
