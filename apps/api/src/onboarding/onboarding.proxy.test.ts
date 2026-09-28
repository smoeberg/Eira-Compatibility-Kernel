import { afterEach, describe, expect, it, vi } from "vitest";
import { Readable, Writable } from "node:stream";
import type { Request, Response } from "express";
import { OnboardingService, type SetupRecord, type SetupStore } from "./onboarding.service";
import { ProxyService } from "../proxy/proxy.service";
import { FingerprintService } from "../fingerprint/fingerprint.service";

class MemoryStore implements SetupStore {
  private rows = new Map<string, SetupRecord>();
  private hosts = new Map<string, string>();
  events: string[] = [];
  async create(state: SetupRecord["state"], host: string) {
    this.rows.set(state.id, { state, version: 0 }); this.hosts.set(host, state.id);
  }
  async get(id: string) { return this.rows.get(id) ?? null; }
  async getByHost(host: string) { return this.get(this.hosts.get(host) ?? ""); }
  async list(tenantId: string) { return [...this.rows.values()].filter((r) => r.state.tenantId === tenantId).map((r) => r.state); }
  async due(now: Date) { return [...this.rows.values()].filter((r) =>
    (r.state.status === "active" && !!r.state.recordingEndsAt && new Date(r.state.recordingEndsAt) <= now) ||
    (r.state.status === "trial" && !!r.state.trialEndsAt && new Date(r.state.trialEndsAt) <= now)); }
  async replace(record: SetupRecord, next: SetupRecord["state"], event: string) {
    const current = this.rows.get(next.id);
    if (!current || current.version !== record.version) return false;
    this.rows.set(next.id, { state: next, version: record.version + 1 }); this.events.push(event); return true;
  }
}

class TestResponse extends Writable {
  statusCode = 200; headers = new Map<string, string>(); chunks: Buffer[] = [];
  status(code: number) { this.statusCode = code; return this; }
  json(body: unknown) { this.end(JSON.stringify(body)); return this; }
  setHeader(key: string, value: string) { this.headers.set(key, value); return this; }
  get headersSent() { return this.writableEnded; }
  _write(chunk: Buffer, _encoding: BufferEncoding, done: (error?: Error | null) => void) {
    this.chunks.push(Buffer.from(chunk)); done();
  }
}

describe("synthetic traffic through hosted proxy", () => {
  afterEach(() => { vi.unstubAllGlobals(); delete process.env.ECK_ALLOWED_UPSTREAM_HOSTS; delete process.env.ECK_FP_DOMAIN; });

  it("requires actual upstream success, records only active traffic, keeps forwarding after expiry", async () => {
    process.env.ECK_ALLOWED_UPSTREAM_HOSTS = "graph.example.test";
    process.env.ECK_FP_DOMAIN = "fp.example.test";
    const store = new MemoryStore();
    const tenants = { findById: vi.fn().mockResolvedValue({ id: "tenant-a" }) };
    const onboarding = new OnboardingService(store as never, tenants as never);
    const state = await onboarding.create("tenant-a", { name: "Syntetisk", environment: "test", upstreamUrl: "https://graph.example.test" });
    const host = new URL(state.proxyUrl).hostname;
    const fingerprint = new FingerprintService({} as never);
    const ingested: unknown[] = [];
    vi.spyOn(fingerprint, "ingest").mockImplementation(async (dto) => {
      ingested.push(dto); return { stored: true, normalizedPath: "/users/{id}", category: "identity" };
    });
    const proxy = new ProxyService(onboarding, fingerprint);
    let upstreamStatus = 503;
    const upstreamRequests: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: URL) => {
      upstreamRequests.push(url.href);
      return new globalThis.Response("synthetic", { status: upstreamStatus });
    }));
    async function call(path: string) {
      const req = Readable.from([]) as Request;
      Object.assign(req, { hostname: host, url: path, method: "GET", headers: { authorization: "Bearer secret" } });
      const res = new TestResponse();
      await proxy.handle(req, res as unknown as Response);
      await new Promise<void>((resolve) => { if (res.writableEnded) resolve(); else res.on("finish", resolve); });
      return res;
    }
    await expect(onboarding.apply("tenant-a", state.id, { type: "start_recording", durationDays: 1 }, "admin")).rejects.toThrow();
    await onboarding.apply("tenant-a", state.id, { type: "mark_ready", preflightConfirmed: true }, "admin");
    await onboarding.apply("tenant-a", state.id, { type: "configuration_saved" }, "admin");
    expect((await call("/v1.0/users/alice?token=secret")).statusCode).toBe(503);
    expect((await onboarding.get("tenant-a", state.id)).status).toBe("awaiting_traffic");
    upstreamStatus = 200;
    expect((await call("/v1.0/users/alice?token=secret")).statusCode).toBe(200);
    expect((await onboarding.get("tenant-a", state.id)).status).toBe("trial");
    await expect(onboarding.apply("tenant-a", state.id, { type: "start_recording", durationDays: 1 }, "admin")).rejects.toThrow();
    await onboarding.apply("tenant-a", state.id, { type: "confirm_trial", customerSawExpectedResult: true }, "admin");
    const active = await onboarding.apply("tenant-a", state.id, { type: "start_recording", durationDays: 1 }, "admin");
    await call("/v1.0/users/bob?token=secret");
    expect(ingested).toHaveLength(1);
    expect(JSON.stringify(ingested)).not.toContain("secret");
    await onboarding.expireDue(new Date(active.recordingEndsAt!));
    await call("/v1.0/users/charlie?token=secret");
    expect(ingested).toHaveLength(1);
    expect((await onboarding.get("tenant-a", state.id)).status).toBe("passthrough_only");
    expect(upstreamRequests).toHaveLength(4);
    await onboarding.apply("tenant-a", state.id, { type: "begin_rollback" }, "admin");
    await expect(onboarding.apply("tenant-a", state.id, { type: "confirm_rollback", customerRestoredUrl: false, directCallSucceeded: true } as never, "admin")).rejects.toThrow();
    await onboarding.apply("tenant-a", state.id, { type: "confirm_rollback", customerRestoredUrl: true, directCallSucceeded: true }, "admin");
    await call("/v1.0/users/late");
    expect(upstreamRequests).toHaveLength(5);
    expect(ingested).toHaveLength(1);
    expect(store.events).toContain("expire");
  });

  it("stores only approved route templates and drops request secrets", async () => {
    const service = new FingerprintService({} as never);
    const known = await service.ingest({ tenantId: "tenant-a", method: "GET", path: "/v1.0/users/alice?token=secret",
      pathRaw: "/v1.0/users/alice", requestHeaders: { authorization: "Bearer secret" } });
    const unknown = await service.ingest({ tenantId: "tenant-a", method: "GET", path: "/v1.0/cases/1234567890?code=secret" });
    expect(known.normalizedPath).toBe("/users/{id}");
    expect(unknown.normalizedPath).toBe("/unknown");
    expect(JSON.stringify([known, unknown])).not.toContain("secret");
  });
});
