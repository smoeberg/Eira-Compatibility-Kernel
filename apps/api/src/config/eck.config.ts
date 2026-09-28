export function buildProxyUrl(slug: string): string {
  const domain = process.env.ECK_FP_DOMAIN ?? "fp.localhost";
  const protocol = process.env.ECK_PUBLIC_PROTOCOL ?? "http";
  return `${protocol}://${slug}.${domain}`;
}
export function isFingerprintProxyHost(host: string): boolean {
  const domain = process.env.ECK_FP_DOMAIN ?? "fp.localhost";
  return host.toLowerCase().endsWith(`.${domain}`);
}
export function extractSlugFromHost(host: string): string | null {
  const domain = process.env.ECK_FP_DOMAIN ?? "fp.localhost";
  return isFingerprintProxyHost(host) ? host.toLowerCase().slice(0, -domain.length - 1) : null;
}
