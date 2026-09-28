import { describe, expect, it, vi } from "vitest";
import { createLogger } from "./logger";
import { renderPrometheusMetrics, recordHttpRequest } from "./metrics";

describe("observability", () => {
  it("emits JSON logs", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const log = createLogger("test");
    log.info("hello", { correlationId: "abc" });
    expect(spy.mock.calls[0]?.[0]).toContain('"correlationId":"abc"');
    spy.mockRestore();
  });

  it("renders prometheus metrics", () => {
    recordHttpRequest({
      service: "eck-api",
      method: "GET",
      path: "/health",
      statusCode: 200,
      durationMs: 3,
    });
    const text = renderPrometheusMetrics("eck-api");
    expect(text).toContain("eck_http_requests_total");
    expect(text).toContain("eck_up");
  });
});
