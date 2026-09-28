import type { CanonicalIdentity } from "./auth-identity";
import type { CanonicalCalendarEvent } from "./calendar";
import type { CanonicalFile } from "./files";
import type { CanonicalGroup, CanonicalGroupMembership, CanonicalUser } from "./identity";
import type { CanonicalMailMessage, CanonicalMailbox } from "./mail";
import type { CanonicalPermission } from "./permission";
import type { CanonicalCommand } from "./commands";

export type CanonicalKind =
  | "user"
  | "identity"
  | "group"
  | "groupMembership"
  | "file"
  | "calendarEvent"
  | "mailMessage"
  | "mailbox"
  | "permission";

/** Read model — platform- and backend-neutral entities. */
export type CanonicalEntity =
  | { kind: "user"; data: CanonicalUser }
  | { kind: "identity"; data: CanonicalIdentity }
  | { kind: "group"; data: CanonicalGroup }
  | { kind: "groupMembership"; data: CanonicalGroupMembership }
  | { kind: "file"; data: CanonicalFile }
  | { kind: "calendarEvent"; data: CanonicalCalendarEvent }
  | { kind: "mailMessage"; data: CanonicalMailMessage }
  | { kind: "mailbox"; data: CanonicalMailbox }
  | { kind: "permission"; data: CanonicalPermission };

export type CanonicalValue = CanonicalEntity | CanonicalCommand;

export function isCanonicalEntity(value: CanonicalValue): value is CanonicalEntity {
  return "kind" in value;
}

export function isCanonicalCommand(value: CanonicalValue): value is CanonicalCommand {
  return "op" in value;
}
