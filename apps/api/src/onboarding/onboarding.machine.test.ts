import { describe, expect, it } from "vitest";
import { isRecording, transition, type SetupState } from "./onboarding.machine";

const at = (minute: number) => new Date(Date.parse("2026-09-28T10:00:00Z") + minute * 60000);
const draft = (): SetupState => ({
  id: "integration-a", tenantId: "tenant-a", name: "Syntetisk fagsystem",
  environment: "test", status: "draft", proxyUrl: "https://a.fp.example.test",
  upstreamUrl: "https://upstream.example.test", createdAt: at(0).toISOString(),
  updatedAt: at(0).toISOString(), observedCalls: 0, successfulCalls: 0,
  customerConfirmed: false,
});

describe("guided fingerprint state machine with synthetic traffic", () => {
  it("requires a successful upstream response and customer confirmation before recording", () => {
    const ready = transition(draft(), { type: "mark_ready", preflightConfirmed: true }, at(1));
    const awaiting = transition(ready, { type: "configuration_saved" }, at(2));
    expect(() => transition(awaiting, { type: "start_recording", durationDays: 14 }, at(3))).toThrow();
    const failed = transition(awaiting, { type: "proxy_call", upstreamStatus: 502 }, at(3));
    expect(failed.status).toBe("awaiting_traffic");
    const trial = transition(failed, { type: "proxy_call", upstreamStatus: 200 }, at(4));
    expect(trial.status).toBe("trial");
    expect(() => transition(trial, { type: "start_recording", durationDays: 14 }, at(5))).toThrow();
    const confirmed = transition(trial, { type: "confirm_trial", customerSawExpectedResult: true }, at(5));
    const active = transition(confirmed, { type: "start_recording", durationDays: 1 }, at(6));
    expect(isRecording(active, at(7))).toBe(true);
    expect(active.successfulCalls).toBe(1);
    expect(active.observedCalls).toBe(2);
  });

  it("expires observation while passthrough continues and needs direct rollback proof", () => {
    const ready = transition(draft(), { type: "mark_ready", preflightConfirmed: true }, at(1));
    const awaiting = transition(ready, { type: "configuration_saved" }, at(2));
    const trial = transition(awaiting, { type: "proxy_call", upstreamStatus: 204 }, at(3));
    const confirmed = transition(trial, { type: "confirm_trial", customerSawExpectedResult: true }, at(4));
    const active = transition(confirmed, { type: "start_recording", durationDays: 1 }, at(5));
    const end = new Date(active.recordingEndsAt!);
    expect(isRecording(active, end)).toBe(false);
    const expired = transition(active, { type: "expire" }, end);
    expect(expired.status).toBe("passthrough_only");
    const stillForwarding = transition(expired, { type: "proxy_call", upstreamStatus: 200 }, at(1500));
    expect(stillForwarding.status).toBe("passthrough_only");
    expect(isRecording(stillForwarding, at(1500))).toBe(false);
    const rollback = transition(stillForwarding, { type: "begin_rollback" }, at(1501));
    const closed = transition(rollback, { type: "confirm_rollback", customerRestoredUrl: true, directCallSucceeded: true }, at(1502));
    expect(closed.status).toBe("closed");
  });

  it("does not start an expired trial or incident, and rejects unsupported systems", () => {
    const awaiting = transition(transition(draft(), { type: "mark_ready", preflightConfirmed: true }, at(1)), { type: "configuration_saved" }, at(2));
    const trial = transition(awaiting, { type: "proxy_call", upstreamStatus: 200 }, at(3));
    expect(() => transition(trial, { type: "confirm_trial", customerSawExpectedResult: true }, at(124))).toThrow();
    const incident = transition(trial, { type: "incident", reason: "Upstream failures" }, at(5));
    expect(() => transition(incident, { type: "start_recording", durationDays: 1 }, at(6))).toThrow();
    expect(transition(draft(), { type: "mark_unsupported", reason: "Hardcoded URL" }, at(1)).status).toBe("unsupported");
  });
});
