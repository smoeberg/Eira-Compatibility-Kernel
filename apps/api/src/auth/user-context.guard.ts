import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import type { EckUserContext } from "./auth.types";

@Injectable()
export class UserContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const requireUser = process.env.ECK_REQUIRE_USER_CONTEXT === "true";

    const sub = request.header("x-user-sub");
    const email = request.header("x-user-email") ?? undefined;
    const rolesHeader = request.header("x-user-roles") ?? "";
    const accessToken = request.header("x-user-token") ?? undefined;

    if (!sub) {
      if (requireUser) {
        throw new UnauthorizedException("Missing user context (X-User-Sub)");
      }
      return true;
    }

    const roles = rolesHeader
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    const user: EckUserContext = {
      sub,
      email,
      roles,
      accessToken,
    };

    request.eckUser = user;
    return true;
  }
}
