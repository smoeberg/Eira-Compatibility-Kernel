import type {
  CanonicalGroup,
  CanonicalGroupMembership,
  CanonicalIdentity,
  CanonicalIdentityCreate,
  CanonicalId,
  CanonicalUser,
  CanonicalUserCreate,
  CanonicalUserPatch,
} from "@eck/translation";
import type { AdapterContext, AdapterPlugin } from "./base";

export interface IIdentityAdapter extends AdapterPlugin {
  readonly domain: "identity";
  getUser(ctx: AdapterContext, id: CanonicalId): Promise<CanonicalUser>;
  listUsers(ctx: AdapterContext): Promise<CanonicalUser[]>;
  createUser(
    ctx: AdapterContext,
    payload: CanonicalUserCreate,
  ): Promise<CanonicalUser>;
  updateUser(
    ctx: AdapterContext,
    id: CanonicalId,
    patch: CanonicalUserPatch,
  ): Promise<CanonicalUser>;
  deleteUser(ctx: AdapterContext, id: CanonicalId): Promise<void>;
  getGroup(ctx: AdapterContext, id: CanonicalId): Promise<CanonicalGroup>;
  listGroupMembers(
    ctx: AdapterContext,
    groupId: CanonicalId,
  ): Promise<CanonicalGroupMembership[]>;
  getIdentity(
    ctx: AdapterContext,
    id: CanonicalId,
  ): Promise<CanonicalIdentity>;
  createIdentity(
    ctx: AdapterContext,
    payload: CanonicalIdentityCreate,
  ): Promise<CanonicalIdentity>;
}

export const IDENTITY_ADAPTER = Symbol("IIdentityAdapter");
