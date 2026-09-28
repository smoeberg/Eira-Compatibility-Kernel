import type { ServiceIdentity } from "@eck/service-auth";

export interface EckUserContext {
  sub: string;
  email?: string;
  roles: string[];
  accessToken?: string;
}

declare module "express-serve-static-core" {
  interface Request {
    eckUser?: EckUserContext;
    eckServiceId?: ServiceIdentity;
    correlationId?: string;
    rawBody?: Buffer;
  }
}
