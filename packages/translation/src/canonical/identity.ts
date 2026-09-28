import type { CanonicalEntityBase, CanonicalId } from "./ids";

export interface CanonicalUser extends CanonicalEntityBase {
  displayName: string;
  mail?: string;
  userPrincipalName?: string;
  enabled: boolean;
}

export interface CanonicalGroup extends CanonicalEntityBase {
  displayName: string;
  description?: string;
  mail?: string;
}

export interface CanonicalGroupMembership {
  groupId: CanonicalId;
  userId: CanonicalId;
  role?: "member" | "owner";
}

export type CanonicalUserCreate = Omit<CanonicalUser, "id" | "externalRefs"> & {
  id?: CanonicalId;
  externalRefs?: CanonicalUser["externalRefs"];
};

export type CanonicalUserPatch = Partial<
  Pick<CanonicalUser, "displayName" | "mail" | "userPrincipalName" | "enabled">
>;
