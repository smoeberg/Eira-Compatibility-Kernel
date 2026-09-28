import type { CanonicalEntityBase } from "./ids";

export type CanonicalFileKind = "file" | "folder";

/** Canonical File — storage-neutral (Graph driveItem, NC file, S3 object). */
export interface CanonicalFile extends CanonicalEntityBase {
  kind: CanonicalFileKind;
  name: string;
  parentId?: string;
  mimeType?: string;
  sizeBytes?: number;
  etag?: string;
}

/** @deprecated Use CanonicalFile */
export type CanonicalDriveItem = CanonicalFile;
/** @deprecated Use CanonicalFileKind */
export type CanonicalDriveItemKind = CanonicalFileKind;

export type CanonicalFileCreate = Omit<CanonicalFile, "id" | "externalRefs"> & {
  id?: CanonicalFile["id"];
  externalRefs?: CanonicalFile["externalRefs"];
};

/** @deprecated Use CanonicalFileCreate */
export type CanonicalDriveItemCreate = CanonicalFileCreate;

export type CanonicalFilePatch = Partial<
  Pick<CanonicalFile, "name" | "parentId" | "mimeType">
>;

/** @deprecated Use CanonicalFilePatch */
export type CanonicalDriveItemPatch = CanonicalFilePatch;
