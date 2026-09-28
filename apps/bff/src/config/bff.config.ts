export function bffConfig() {
  const upstream = (
    process.env.ECK_UPSTREAM_API_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");

  return {
    upstream,
    serviceToken: process.env.ECK_SERVICE_TOKEN?.trim() ?? "",
    oidc: {
      enabled: process.env.ECK_OIDC_ENABLED === "true",
      tenantId: process.env.ECK_OIDC_TENANT_ID?.trim() ?? "",
      clientId: process.env.ECK_OIDC_CLIENT_ID?.trim() ?? "",
      clientSecret: process.env.ECK_OIDC_CLIENT_SECRET?.trim() ?? "",
      redirectUri:
        process.env.ECK_OIDC_REDIRECT_URI ??
        "http://eck.localhost/auth/callback",
      postLogoutRedirect:
        process.env.ECK_OIDC_POST_LOGOUT_REDIRECT ?? "http://eck.localhost/",
      scopes: process.env.ECK_OIDC_SCOPES ?? "openid profile email",
    },
    sessionSecret:
      process.env.ECK_BFF_SESSION_SECRET ?? "dev-bff-session-change-me",
    trustProxy: process.env.ECK_BFF_TRUST_PROXY !== "false",
  };
}

export function oidcIssuerBase(tenantId: string): string {
  return `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/v2.0`;
}

export function isOidcConfigured(): boolean {
  const c = bffConfig().oidc;
  return (
    c.enabled &&
    c.tenantId !== "" &&
    c.clientId !== "" &&
    c.clientSecret !== ""
  );
}
