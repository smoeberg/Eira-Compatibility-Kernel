import type { CanonicalCalendarEventCreate, CanonicalCalendarEventPatch } from "./calendar";
import type { CanonicalFileCreate, CanonicalFilePatch } from "./files";
import type { CanonicalId } from "./ids";
import type { CanonicalIdentityCreate } from "./auth-identity";
import type { CanonicalMailMessageCreate } from "./mail";
import type { CanonicalPermissionGrant } from "./permission";
import type { CanonicalUserCreate, CanonicalUserPatch } from "./identity";

/** Write operations — canonical commands independent of platform/backend syntax. */
export type CanonicalCommand =
  | { op: "identity.user.create"; payload: CanonicalUserCreate }
  | { op: "identity.user.update"; id: CanonicalId; patch: CanonicalUserPatch }
  | { op: "identity.user.delete"; id: CanonicalId }
  | { op: "identity.principal.create"; payload: CanonicalIdentityCreate }
  | { op: "files.item.create"; payload: CanonicalFileCreate }
  | { op: "files.item.update"; id: CanonicalId; patch: CanonicalFilePatch }
  | { op: "files.item.delete"; id: CanonicalId }
  | { op: "calendar.event.create"; payload: CanonicalCalendarEventCreate }
  | { op: "calendar.event.update"; id: CanonicalId; patch: CanonicalCalendarEventPatch }
  | { op: "calendar.event.delete"; id: CanonicalId }
  | { op: "mail.message.create"; payload: CanonicalMailMessageCreate }
  | { op: "mail.message.delete"; id: CanonicalId }
  | { op: "permission.grant"; payload: CanonicalPermissionGrant }
  | { op: "permission.revoke"; id: CanonicalId };

export type CanonicalCommandOp = CanonicalCommand["op"];
