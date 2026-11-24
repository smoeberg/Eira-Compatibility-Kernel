export interface CreateTenantDto {
  slug: string;
  name: string;
  contactEmail?: string;
}

export interface UpdateTenantDto {
  name?: string;
  contactEmail?: string;
}

export interface TenantResponse {
  id: string;
  slug: string;
  name: string;
  contactEmail: string | null;
  createdAt: string;
}
