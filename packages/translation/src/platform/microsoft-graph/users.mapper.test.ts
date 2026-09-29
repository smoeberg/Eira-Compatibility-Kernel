import { describe, expect, it } from "vitest";
import { PLATFORM_IDS } from "../../canonical";
import {
  graphUserInbound,
  graphUserOutbound,
} from "./users.mapper";

describe("microsoft-graph users mapper", () => {
  const ctx = {
    tenantId: "t1",
    requestId: "req-1",
    method: "GET",
    path: "/users/guid",
  };

  it("maps Graph user to canonical", () => {
    const canonical = graphUserInbound.toCanonical(
      {
        id: "graph-abc",
        displayName: "Ada",
        mail: "ada@example.com",
        accountEnabled: true,
      },
      ctx,
    );
    expect(canonical.kind).toBe("user");
    if (canonical.kind === "user") {
      expect(canonical.data.displayName).toBe("Ada");
      expect(canonical.data.externalRefs[0]?.system).toBe(
        PLATFORM_IDS.MICROSOFT_GRAPH,
      );
    }
  });

  it("round-trips canonical user back to Graph", () => {
    const canonical = graphUserInbound.toCanonical(
      { id: "graph-abc", displayName: "Ada" },
      ctx,
    );
    const graph = graphUserOutbound.toPlatform(canonical, ctx);
    expect(graph.id).toBe("graph-abc");
    expect(graph.displayName).toBe("Ada");
  });
});
