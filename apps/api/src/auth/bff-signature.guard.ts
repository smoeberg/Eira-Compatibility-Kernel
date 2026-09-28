import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { verifyBffSignature } from "./bff-signature";
import { matchesServiceToken } from "./service-secrets";

/**
 * When authenticated via service token, user headers must be cryptographically
 * bound to the BFF (HMAC). Prevents forged X-User-* if API is exposed.
 */
@Injectable()
export class BffSignatureGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (!matchesServiceToken(request)) {
      return true;
    }

    const userSub = request.header("x-user-sub")?.trim();
    const requireAll =
      process.env.ECK_REQUIRE_BFF_SIGNATURE === "true" || Boolean(userSub);

    if (!requireAll) {
      return true;
    }

    const result = verifyBffSignature(request);
    if (!result.ok) {
      throw new UnauthorizedException(
        `Invalid BFF signature${result.reason ? `: ${result.reason}` : ""}`,
      );
    }

    return true;
  }
}
