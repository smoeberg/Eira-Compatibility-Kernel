export type {
  BackendId,
  CanonicalId,
  ExternalRef,
  ExternalSystemId,
  IsoDateTime,
  PlatformId,
} from "./ids";
export { BACKEND_IDS, PLATFORM_IDS, externalRef, findExternalRef } from "./ids";

export type {
  CanonicalGroup,
  CanonicalGroupMembership,
  CanonicalUser,
  CanonicalUserCreate,
  CanonicalUserPatch,
} from "./identity";

export type {
  CanonicalIdentity,
  CanonicalIdentityCreate,
} from "./auth-identity";

export type {
  CanonicalFile,
  CanonicalFileCreate,
  CanonicalFileKind,
  CanonicalFilePatch,
  CanonicalDriveItem,
  CanonicalDriveItemCreate,
  CanonicalDriveItemKind,
  CanonicalDriveItemPatch,
} from "./files";

export type {
  CanonicalCalendarEvent,
  CanonicalCalendarEventCreate,
  CanonicalCalendarEventPatch,
} from "./calendar";

export type {
  CanonicalMailMessage,
  CanonicalMailMessageCreate,
  CanonicalMailbox,
} from "./mail";

export type {
  CanonicalPermission,
  CanonicalPermissionGrant,
  CanonicalResourceKind,
  PermissionRole,
} from "./permission";

export type { CanonicalCommand, CanonicalCommandOp } from "./commands";

export type { CanonicalEntity, CanonicalKind, CanonicalValue } from "./entity";
export { isCanonicalCommand, isCanonicalEntity } from "./entity";
