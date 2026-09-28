import type { CanonicalEntityBase, CanonicalId } from "./ids";

export type PermissionRole =
  | "owner"
  | "write"
  | "read"
  | "comment"
  | "none";

export type CanonicalResourceKind =
  | "user"
  | "identity"
  | "group"
  | "file"
  | "calendarEvent"
  | "mailMessage"
  | "mailbox";

/** ACL entry — platform-neutral (Graph roles, NC shares, LDAP groups map here). */
export interface CanonicalPermission extends CanonicalEntityBase {
  subjectId: CanonicalId;
  subjectKind: "user" | "group" | "identity";
  resourceId: CanonicalId;
  resourceKind: CanonicalResourceKind;
  role: PermissionRole;
  inherited?: boolean;
}

export type CanonicalPermissionGrant = Omit<
  CanonicalPermission,
  "id" | "externalRefs"
> & {
  id?: CanonicalPermission["id"];
  externalRefs?: CanonicalPermission["externalRefs"];
};
