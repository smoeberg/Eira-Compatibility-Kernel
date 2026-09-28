export interface CreateFingerprintRunDto { tenantId: string; durationDays?: number }
export interface FingerprintRunResponse {
  id: string; tenantId: string; startedAt: string; endsAt: string;
  status: string; mirrorPercent: number; daysRemaining: number;
}
