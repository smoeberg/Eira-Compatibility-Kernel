import { BadRequestException, ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "../db";
import { TenantService } from "../tenants/tenant.service";
import { InvalidSetupTransition, isRecording, transition, type SetupEvent, type SetupState } from "./onboarding.machine";

export interface SetupRecord { state: SetupState; version: number }

export interface SetupStore {
  create(state: SetupState, host: string): Promise<void>;
  get(id: string): Promise<SetupRecord | null>;
  getByHost(host: string): Promise<SetupRecord | null>;
  list(tenantId: string): Promise<SetupState[]>;
  due(now: Date): Promise<SetupRecord[]>;
  replace(record: SetupRecord, next: SetupState, event: string, actor: string): Promise<boolean>;
}

@Injectable()
export class DbSetupStore implements SetupStore {
  private db() {
    const db = getDb();
    if (!db) throw new ServiceUnavailableException("DATABASE_URL required");
    return db;
  }
  async create(state: SetupState, host: string) {
    await this.db().insert(schema.integrationSetups).values({ id: state.id, tenantId: state.tenantId, proxyHost: host, state });
  }
  async get(id: string): Promise<SetupRecord | null> {
    const [row] = await this.db().select().from(schema.integrationSetups).where(eq(schema.integrationSetups.id, id)).limit(1);
    return row ? { state: row.state as SetupState, version: row.version } : null;
  }
  async getByHost(host: string): Promise<SetupRecord | null> {
    const [row] = await this.db().select().from(schema.integrationSetups).where(eq(schema.integrationSetups.proxyHost, host.toLowerCase())).limit(1);
    return row ? { state: row.state as SetupState, version: row.version } : null;
  }
  async list(tenantId: string): Promise<SetupState[]> {
    const rows = await this.db().select({ state: schema.integrationSetups.state }).from(schema.integrationSetups).where(eq(schema.integrationSetups.tenantId, tenantId));
    return rows.map((row) => row.state as SetupState);
  }
  async due(now: Date): Promise<SetupRecord[]> {
    const rows = await this.db().select().from(schema.integrationSetups)
      .where(sql`(state->>'status' = 'trial' AND (state->>'trialEndsAt')::timestamptz <= ${now.toISOString()}) OR (state->>'status' = 'active' AND (state->>'recordingEndsAt')::timestamptz <= ${now.toISOString()})`)
      .limit(500);
    return rows.map((row) => ({ state: row.state as SetupState, version: row.version }));
  }
  async replace(record: SetupRecord, next: SetupState, event: string, actor: string): Promise<boolean> {
    const db = this.db();
    return db.transaction(async (tx) => {
      const [updated] = await tx.update(schema.integrationSetups)
        .set({ state: next, version: record.version + 1, updatedAt: new Date(next.updatedAt) })
        .where(and(eq(schema.integrationSetups.id, record.state.id), eq(schema.integrationSetups.version, record.version)))
        .returning({ id: schema.integrationSetups.id });
      if (!updated) return false;
      await tx.insert(schema.integrationSetupEvents).values({
        integrationId: next.id, event, actor, fromStatus: record.state.status, toStatus: next.status,
      });
      return true;
    });
  }
}

export interface CreateSetupInput { name: string; environment: "test" | "production"; upstreamUrl: string }

@Injectable()
export class OnboardingService {
  constructor(private readonly store: DbSetupStore, private readonly tenants: TenantService) {}

  async create(tenantId: string, input: CreateSetupInput): Promise<SetupState> {
    await this.tenants.findById(tenantId);
    if (!input.name?.trim() || !["test", "production"].includes(input.environment)) {
      throw new BadRequestException("Name and environment are required");
    }
    let upstream: URL;
    try { upstream = new URL(input.upstreamUrl); } catch { throw new BadRequestException("Invalid upstream URL"); }
    if (upstream.protocol !== "https:" || upstream.username || upstream.password || upstream.search || upstream.hash || upstream.pathname !== "/") {
      throw new BadRequestException("Upstream must be an HTTPS origin without path, credentials or query");
    }
    const allowedHosts = (process.env.ECK_ALLOWED_UPSTREAM_HOSTS ?? "").split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
    if (!allowedHosts.includes(upstream.hostname.toLowerCase())) {
      throw new BadRequestException("Upstream host must be approved by ECK operations");
    }
    const domain = process.env.ECK_FP_DOMAIN;
    if (!domain || !/^[a-z0-9.-]+$/i.test(domain)) throw new ServiceUnavailableException("ECK_FP_DOMAIN required");
    const id = randomUUID();
    const host = `${id}.${domain}`.toLowerCase();
    const now = new Date().toISOString();
    const state: SetupState = {
      id, tenantId, name: input.name.trim(), environment: input.environment, status: "draft",
      proxyUrl: `https://${host}`, upstreamUrl: upstream.origin, createdAt: now, updatedAt: now,
      observedCalls: 0, successfulCalls: 0, customerConfirmed: false,
    };
    await this.store.create(state, host);
    return state;
  }

  async get(tenantId: string, id: string): Promise<SetupState> {
    const record = await this.store.get(id);
    if (!record || record.state.tenantId !== tenantId) throw new NotFoundException("Integration not found");
    return record.state;
  }

  list(tenantId: string) { return this.store.list(tenantId); }

  async findForHost(host: string): Promise<SetupState | null> {
    return (await this.store.getByHost(host.toLowerCase()))?.state ?? null;
  }

  async apply(tenantId: string, id: string, event: SetupEvent, actor: string, now = new Date()): Promise<SetupState> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const record = await this.store.get(id);
      if (!record || record.state.tenantId !== tenantId) throw new NotFoundException("Integration not found");
      let next: SetupState;
      try { next = transition(record.state, event, now); }
      catch (error) {
        if (error instanceof InvalidSetupTransition) throw new ConflictException(error.message);
        throw error;
      }
      if (await this.store.replace(record, next, event.type, actor)) return next;
    }
    throw new ConflictException("Integration changed concurrently; retry");
  }

  async observeHost(host: string, upstreamStatus: number, now = new Date()): Promise<{ integrationId: string; record: boolean } | null> {
    const record = await this.store.getByHost(host);
    if (!record || ["draft", "ready", "unsupported"].includes(record.state.status)) return null;
    if ((record.state.status === "active" && record.state.recordingEndsAt && now >= new Date(record.state.recordingEndsAt)) ||
        (record.state.status === "trial" && record.state.trialEndsAt && now >= new Date(record.state.trialEndsAt))) {
      await this.apply(record.state.tenantId, record.state.id, { type: "expire" }, "scheduler", now);
    }
    const state = await this.apply(record.state.tenantId, record.state.id, { type: "proxy_call", upstreamStatus }, "proxy", now);
    return { integrationId: state.id, record: isRecording(state, now) };
  }

  async expireDue(now = new Date()): Promise<number> {
    const due = await this.store.due(now);
    let count = 0;
    for (const record of due) {
      try {
        await this.apply(record.state.tenantId, record.state.id, { type: "expire" }, "scheduler", now);
        count++;
      } catch (error) {
        if (!(error instanceof ConflictException)) throw error;
      }
    }
    return count;
  }
}
