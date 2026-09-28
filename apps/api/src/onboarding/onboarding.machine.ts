export type SetupStatus =
  | "draft" | "ready" | "awaiting_traffic" | "trial" | "active"
  | "passthrough_only" | "rollback_pending" | "closed" | "incident" | "unsupported";

export interface SetupState {
  id: string;
  tenantId: string;
  name: string;
  environment: "test" | "production";
  status: SetupStatus;
  proxyUrl: string;
  upstreamUrl: string;
  createdAt: string;
  updatedAt: string;
  trialEndsAt?: string;
  recordingEndsAt?: string;
  firstSuccessfulCallAt?: string;
  lastProxyCallAt?: string;
  observedCalls: number;
  successfulCalls: number;
  customerConfirmed: boolean;
  rollbackConfirmedAt?: string;
  reason?: string;
}

export type SetupEvent =
  | { type: "mark_ready"; preflightConfirmed: true }
  | { type: "mark_unsupported"; reason: string }
  | { type: "configuration_saved" }
  | { type: "proxy_call"; upstreamStatus: number }
  | { type: "confirm_trial"; customerSawExpectedResult: true }
  | { type: "start_recording"; durationDays: number }
  | { type: "stop_recording" }
  | { type: "expire" }
  | { type: "begin_rollback" }
  | { type: "confirm_rollback"; directCallSucceeded: true; customerRestoredUrl: true }
  | { type: "incident"; reason: string };

export class InvalidSetupTransition extends Error {}

export function isRecording(state: SetupState, now: Date): boolean {
  return state.status === "active" && !!state.recordingEndsAt && now < new Date(state.recordingEndsAt);
}

export function transition(state: SetupState, event: SetupEvent, now: Date): SetupState {
  const updated: SetupState = { ...state, updatedAt: now.toISOString() };
  const requireStatus = (...allowed: SetupStatus[]) => {
    if (!allowed.includes(state.status)) {
      throw new InvalidSetupTransition(`${event.type} is not allowed from ${state.status}`);
    }
  };
  switch (event.type) {
    case "mark_ready":
      requireStatus("draft");
      if (event.preflightConfirmed !== true || state.environment !== "test") {
        throw new InvalidSetupTransition("Documented test-environment preflight is required");
      }
      return { ...updated, status: "ready" };
    case "mark_unsupported":
      requireStatus("draft");
      if (!event.reason.trim()) throw new InvalidSetupTransition("A reason is required");
      return { ...updated, status: "unsupported", reason: event.reason.trim() };
    case "configuration_saved":
      requireStatus("ready");
      return { ...updated, status: "awaiting_traffic" };
    case "proxy_call": {
      requireStatus("awaiting_traffic", "trial", "active", "passthrough_only", "rollback_pending", "incident", "closed");
      const success = event.upstreamStatus >= 200 && event.upstreamStatus < 400;
      const status = state.status === "awaiting_traffic" && success ? "trial" : state.status;
      return {
        ...updated, status, lastProxyCallAt: now.toISOString(),
        observedCalls: state.observedCalls + 1,
        successfulCalls: state.successfulCalls + Number(success),
        firstSuccessfulCallAt: state.firstSuccessfulCallAt ?? (success ? now.toISOString() : undefined),
        trialEndsAt: status === "trial" && !state.trialEndsAt
          ? new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString() : state.trialEndsAt,
      };
    }
    case "confirm_trial":
      requireStatus("trial");
      if (event.customerSawExpectedResult !== true) throw new InvalidSetupTransition("Customer confirmation is required");
      if (!state.firstSuccessfulCallAt || !state.trialEndsAt || now >= new Date(state.trialEndsAt)) {
        throw new InvalidSetupTransition("The successful trial has expired");
      }
      return { ...updated, customerConfirmed: true };
    case "start_recording":
      requireStatus("trial");
      if (!state.customerConfirmed || !state.firstSuccessfulCallAt || !state.trialEndsAt || now >= new Date(state.trialEndsAt)) {
        throw new InvalidSetupTransition("A current, customer-confirmed trial is required");
      }
      if (!Number.isInteger(event.durationDays) || event.durationDays < 1 || event.durationDays > 14) {
        throw new InvalidSetupTransition("Recording must last 1–14 days");
      }
      return { ...updated, status: "active", recordingEndsAt: new Date(now.getTime() + event.durationDays * 86400000).toISOString() };
    case "stop_recording":
      requireStatus("active");
      return { ...updated, status: "passthrough_only" };
    case "expire":
      if (state.status === "trial" && state.trialEndsAt && now >= new Date(state.trialEndsAt)) {
        return { ...updated, status: "passthrough_only" };
      }
      if (state.status === "active" && state.recordingEndsAt && now >= new Date(state.recordingEndsAt)) {
        return { ...updated, status: "passthrough_only" };
      }
      throw new InvalidSetupTransition("No observation period is due to expire");
    case "begin_rollback":
      requireStatus("awaiting_traffic", "trial", "passthrough_only", "incident");
      return { ...updated, status: "rollback_pending" };
    case "confirm_rollback":
      requireStatus("rollback_pending");
      if (event.customerRestoredUrl !== true || event.directCallSucceeded !== true) {
        throw new InvalidSetupTransition("Customer must confirm restoration and a direct call");
      }
      return { ...updated, status: "closed", rollbackConfirmedAt: now.toISOString() };
    case "incident":
      requireStatus("awaiting_traffic", "trial", "active", "passthrough_only");
      if (!event.reason.trim()) throw new InvalidSetupTransition("A reason is required");
      return { ...updated, status: "incident", reason: event.reason.trim() };
  }
}
