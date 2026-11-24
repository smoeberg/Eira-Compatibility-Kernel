import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../db";
import type {
  CreateTenantDto,
  TenantResponse,
  UpdateTenantDto,
} from "./tenant.dto";
import { assertValidSlug, normalizeSlug } from "./tenant.utils";

@Injectable()
export class TenantService {
  private requireDb() {
    const db = getDb();
    if (!db) {
      throw new ServiceUnavailableException("DATABASE_URL required");
    }
    return db;
  }

  private toResponse(row: typeof schema.tenants.$inferSelect): TenantResponse {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      contactEmail: row.contactEmail ?? null,
      createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  async create(dto: CreateTenantDto): Promise<TenantResponse> {
    const db = this.requireDb();
    const slug = normalizeSlug(dto.slug);
    try {
      assertValidSlug(slug);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }

    try {
      const [row] = await db
        .insert(schema.tenants)
        .values({
          slug,
          name: dto.name.trim(),
          contactEmail: dto.contactEmail?.trim() ?? null,
        })
        .returning();
      return this.toResponse(row);
    } catch {
      throw new ConflictException(`Tenant slug "${slug}" already exists`);
    }
  }

  async findAll(): Promise<TenantResponse[]> {
    const db = this.requireDb();
    const rows = await db.select().from(schema.tenants);
    return rows.map((row) => this.toResponse(row));
  }

  async findById(id: string): Promise<TenantResponse> {
    const db = this.requireDb();
    const [row] = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Tenant ${id} not found`);
    }
    return this.toResponse(row);
  }

  async findBySlug(slug: string): Promise<TenantResponse> {
    const db = this.requireDb();
    const [row] = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.slug, slug))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Tenant slug "${slug}" not found`);
    }
    return this.toResponse(row);
  }

  async update(id: string, dto: UpdateTenantDto): Promise<TenantResponse> {
    const db = this.requireDb();
    const [row] = await db
      .update(schema.tenants)
      .set({
        name: dto.name?.trim(),
        contactEmail: dto.contactEmail?.trim(),
      })
      .where(eq(schema.tenants.id, id))
      .returning();

    if (!row) {
      throw new NotFoundException(`Tenant ${id} not found`);
    }
    return this.toResponse(row);
  }
}
