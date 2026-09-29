import { BACKEND_IDS, type BackendId } from "@eck/translation";
import { NextcloudStorageAdapter } from "./nextcloud-storage.adapter";

/** Contract-only stub. An S3 backend must supply its own implementation. */
export class S3StorageAdapter extends NextcloudStorageAdapter {
  override readonly pluginId: BackendId = BACKEND_IDS.S3;
}
