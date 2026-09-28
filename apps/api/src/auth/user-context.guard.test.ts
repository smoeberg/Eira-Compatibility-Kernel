import { UnauthorizedException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { afterEach, describe, expect, it } from "vitest";
import { UserContextGuard } from "./user-context.guard";

function ctx(headers: Record<string, string>): ExecutionContext {
  const req: { header: (n: string) => string | undefined; eckUser?: unknown } =
    {
      header: (n: string) => headers[n.toLowerCase()] ?? headers[n],
    };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as ExecutionContext;
}

describe("UserContextGuard", () => {
  afterEach(() => {
    delete process.env.ECK_REQUIRE_USER_CONTEXT;
  });

  it("attaches user when X-User-Sub present", () => {
    const guard = new UserContextGuard();
    const context = ctx({
      "x-user-sub": "user-1",
      "x-user-email": "a@b.dk",
      "x-user-roles": "eck_operator",
    });
    const req = context.switchToHttp().getRequest() as {
      eckUser?: { sub: string; email?: string; roles: string[] };
    };
    expect(guard.canActivate(context)).toBe(true);
    expect(req.eckUser?.sub).toBe("user-1");
    expect(req.eckUser?.roles).toEqual(["eck_operator"]);
  });

  it("requires user when ECK_REQUIRE_USER_CONTEXT=true", () => {
    process.env.ECK_REQUIRE_USER_CONTEXT = "true";
    const guard = new UserContextGuard();
    expect(() => guard.canActivate(ctx({}))).toThrow(UnauthorizedException);
  });
});
