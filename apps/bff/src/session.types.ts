export interface EckSessionUser {
  sub: string;
  email?: string;
  name?: string;
  accessToken?: string;
  roles: string[];
}

declare module "express-session" {
  interface SessionData {
    oidcState?: string;
    oidcVerifier?: string;
    oidcReturn?: string;
    user?: EckSessionUser;
  }
}

declare module "express-serve-static-core" {
  interface Request {
    correlationId?: string;
    rawBody?: Buffer;
  }
}
