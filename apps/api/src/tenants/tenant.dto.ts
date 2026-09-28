export interface CreateTenantDto {
  slug: string;
  name: string;
  legacyBaseUrl: string;
  contactEmail?: string;
}

export interface UpdateTenantDto {
  name?: string;
  legacyBaseUrl?: string;
  contactEmail?: string;
}

export interface TenantResponse {
  id: string;
  slug: string;
  name: string;
  legacyBaseUrl: string;
  contactEmail: string | null;
  proxyUrl: string;
  createdAt: string;
}
