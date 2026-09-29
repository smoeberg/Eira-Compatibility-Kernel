import {
  PLATFORM_IDS,
  externalRef,
  isCanonicalEntity,
  type CanonicalUser,
} from "../../canonical";
import type { PlatformInboundMapper, PlatformOutboundMapper } from "../mapper";

/** Minimal Graph user shape — expand as contract tests grow. */
export interface GraphUser {
  id: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
  accountEnabled?: boolean;
}

export const graphUserInbound: PlatformInboundMapper<GraphUser> = {
  platformId: PLATFORM_IDS.MICROSOFT_GRAPH,
  toCanonical(platform, ctx) {
    const user: CanonicalUser = {
      id: ctx.requestId,
      externalRefs: [externalRef(PLATFORM_IDS.MICROSOFT_GRAPH, platform.id)],
      displayName: platform.displayName ?? platform.userPrincipalName ?? "",
      mail: platform.mail,
      userPrincipalName: platform.userPrincipalName,
      enabled: platform.accountEnabled ?? true,
    };
    return { kind: "user", data: user };
  },
};

export const graphUserOutbound: PlatformOutboundMapper<GraphUser> = {
  platformId: PLATFORM_IDS.MICROSOFT_GRAPH,
  toPlatform(canonical, _ctx) {
    if (!isCanonicalEntity(canonical) || canonical.kind !== "user") {
      throw new Error("Expected canonical user entity");
    }
    const u = canonical.data;
    const graphId =
      u.externalRefs.find((r) => r.system === PLATFORM_IDS.MICROSOFT_GRAPH)
        ?.id ?? u.id;
    return {
      id: graphId,
      displayName: u.displayName,
      mail: u.mail,
      userPrincipalName: u.userPrincipalName,
      accountEnabled: u.enabled,
    };
  },
};
