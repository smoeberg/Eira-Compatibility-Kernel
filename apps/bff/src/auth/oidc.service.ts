import { Injectable, UnauthorizedException, ServiceUnavailableException } from "@nestjs/common";
import type { Request } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { bffConfig, isOidcConfigured, oidcIssuerBase } from "../config/bff.config";
import type { EckSessionUser } from "../session.types";
import { pkceChallenge, randomToken } from "./oidc.util";

@Injectable()
export class OidcService {
  isEnabled() { return isOidcConfigured(); }
  private config() {
    if (!this.isEnabled()) throw new ServiceUnavailableException("OIDC configuration required");
    return bffConfig().oidc;
  }
  sessionUser(req: Request) { return req.session.user ?? null; }
  requireSessionUser(req: Request): EckSessionUser {
    const user = this.sessionUser(req);
    if (!user?.sub) throw new UnauthorizedException("Login required");
    return user;
  }
  beginLogin(req: Request, returnTo: string) {
    const cfg = this.config();
    if (!returnTo.startsWith("/") || returnTo.startsWith("//") || returnTo.includes("\\")) returnTo = "/";
    const state = randomToken(); const nonce = randomToken(); const verifier = randomToken();
    req.session.oidcState = state; req.session.oidcNonce = nonce;
    req.session.oidcVerifier = verifier; req.session.oidcReturn = returnTo;
    const url = new URL(`${oidcIssuerBase(cfg.tenantId)}/oauth2/v2.0/authorize`);
    url.search = new URLSearchParams({ client_id: cfg.clientId, redirect_uri: cfg.redirectUri,
      response_type: "code", response_mode: "query", scope: cfg.scopes, state, nonce,
      code_challenge: pkceChallenge(verifier), code_challenge_method: "S256" }).toString();
    return url.href;
  }
  async finishCallback(req: Request, code: string, state: string) {
    const cfg = this.config();
    const { oidcState, oidcNonce, oidcVerifier, oidcReturn } = req.session;
    delete req.session.oidcState; delete req.session.oidcNonce;
    delete req.session.oidcVerifier; delete req.session.oidcReturn;
    if (!code || !state || !oidcState || state !== oidcState || !oidcVerifier || !oidcNonce) {
      throw new UnauthorizedException("Invalid OIDC callback state");
    }
    const issuer = oidcIssuerBase(cfg.tenantId);
    const response = await fetch(`${issuer}/oauth2/v2.0/token`, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "authorization_code", client_id: cfg.clientId,
        client_secret: cfg.clientSecret, redirect_uri: cfg.redirectUri, code, code_verifier: oidcVerifier }),
    });
    if (!response.ok) throw new UnauthorizedException("OIDC token exchange failed");
    const tokens = await response.json() as { id_token?: string; access_token?: string };
    if (!tokens.id_token) throw new UnauthorizedException("Missing ID token");
    const jwks = createRemoteJWKSet(new URL(`https://login.microsoftonline.com/${encodeURIComponent(cfg.tenantId)}/discovery/v2.0/keys`));
    const { payload } = await jwtVerify(tokens.id_token, jwks, { issuer, audience: cfg.clientId });
    if (payload.nonce !== oidcNonce || typeof payload.sub !== "string") throw new UnauthorizedException("Invalid OIDC nonce");
    const user: EckSessionUser = { sub: payload.sub, email: typeof payload.email === "string" ? payload.email : undefined,
      name: typeof payload.name === "string" ? payload.name : undefined,
      roles: Array.isArray(payload.roles) ? payload.roles.filter((r): r is string => typeof r === "string") : [] };
    await new Promise<void>((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()));
    req.session.user = user;
    return oidcReturn ?? "/";
  }
  logoutUrl() {
    const cfg = this.config();
    const url = new URL(`${oidcIssuerBase(cfg.tenantId)}/oauth2/v2.0/logout`);
    url.searchParams.set("post_logout_redirect_uri", cfg.postLogoutRedirect);
    return url.href;
  }
}
