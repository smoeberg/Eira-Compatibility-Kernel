export const DEFAULT_FINGERPRINT_DAYS = 14;

export function computeRunWindow(
  startedAt: Date,
  durationDays: number = DEFAULT_FINGERPRINT_DAYS,
): { endsAt: Date; durationDays: number } {
  const days = Math.max(1, Math.min(durationDays, 90));
  const endsAt = new Date(startedAt);
  endsAt.setUTCDate(endsAt.getUTCDate() + days);
  return { endsAt, durationDays: days };
}

export function daysRemaining(endsAt: Date, now: Date = new Date()): number {
  const ms = endsAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function isRunAcceptingIngest(
  status: string,
  endsAt: Date,
  now: Date = new Date(),
): boolean {
  return status === "running" && now <= endsAt;
}

/** True when observationsperioden er slut og run bør afsluttes. */
export function isRunExpired(
  status: string,
  endsAt: Date,
  now: Date = new Date(),
): boolean {
  return status === "running" && now > endsAt;
}
