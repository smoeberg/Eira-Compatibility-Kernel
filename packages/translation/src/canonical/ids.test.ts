import { describe, expect, it } from "vitest";
import { PLATFORM_IDS, externalRef, findExternalRef } from "./ids";

describe("canonical ids", () => {
  it("builds and finds external refs", () => {
    const refs = [
      externalRef(PLATFORM_IDS.MICROSOFT_GRAPH, "graph-1"),
      externalRef("nextcloud", "nc-99", "/files/doc.pdf"),
    ];
    expect(findExternalRef(refs, "nextcloud")?.path).toBe("/files/doc.pdf");
  });
});
