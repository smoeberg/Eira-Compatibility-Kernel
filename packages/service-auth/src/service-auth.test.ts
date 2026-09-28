import { afterEach, describe, expect, it } from "vitest";
import type { Request } from "express";
import {
  buildServiceAuthHeaders,
  verifyServiceAuth,
} from "./service-auth";

function req(
  token: string,
  serviceId?: string,
): Request {
  return {
    header: (name: string) => {
      if (name.toLowerCase() === "authorization") return `Bearer ${token}`;
      if (name.toLowerCase() === "x-eck-service-id") return serviceId;
      return undefined;
    },
  } as Request;
}

describe("service-auth", () => {
  afterEach(() => {
    delete process.env.ECK_SERVICE_TOKEN;
    delete process.env.ECK_REQUIRE_SERVICE_ID;
  });

  it("builds auth headers with service id", () => {
    process.env.ECK_SERVICE_TOKEN = "platform-token";
    expect(buildServiceAuthHeaders("bff")).toEqual({
      Authorization: "Bearer platform-token",
      "X-ECK-Service-Id": "bff",
    });
  });

  it("requires service id by default", () => {
    process.env.ECK_SERVICE_TOKEN = "token";
    expect(verifyServiceAuth(req("token"), ["bff"]).ok).toBe(false);
    expect(verifyServiceAuth(req("token", "bff"), ["bff"]).ok).toBe(true);
  });

  it("rejects disallowed identity", () => {
    process.env.ECK_SERVICE_TOKEN = "token";
    expect(verifyServiceAuth(req("token", "worker"), ["bff"]).ok).toBe(false);
  });
});
