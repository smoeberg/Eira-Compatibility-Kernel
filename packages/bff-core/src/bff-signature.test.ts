import { afterEach, describe, expect, it } from "vitest";
import type { Request } from "express";
import {
  buildBffSignaturePayload,
  computeBffSignature,
  verifyBffSignature,
} from "./bff-signature";

function mockRequest(
  overrides: Partial<Request> & {
    headers?: Record<string, string>;
    rawBody?: Buffer;
  } = {},
): Request {
  const headers = overrides.headers ?? {};
  return {
    method: "POST",
    originalUrl: "/api/v1/tenants",
    url: "/api/v1/tenants",
    body: { slug: "aarhus" },
    header: (name: string) => {
      const key = Object.keys(headers).find(
        (h) => h.toLowerCase() === name.toLowerCase(),
      );
      return key ? headers[key] : undefined;
    },
    ...overrides,
  } as Request;
}

describe("bff-signature", () => {
  afterEach(() => {
    delete process.env.ECK_BFF_SIGNING_SECRET;
  });

  it("builds canonical payload without delimiters", () => {
    expect(
      buildBffSignaturePayload(
        "1719900000",
        "post",
        "/api/v1/tenants",
        '{"slug":"aarhus"}',
        "user-1",
      ),
    ).toBe('1719900000POST/api/v1/tenants{"slug":"aarhus"}user-1');
  });

  it("verifies matching signature", () => {
    process.env.ECK_BFF_SIGNING_SECRET = "sign-secret";
    const ts = String(Math.floor(Date.now() / 1000));
    const body = '{"slug":"aarhus"}';
    const sig = computeBffSignature(
      "sign-secret",
      ts,
      "POST",
      "/api/v1/tenants",
      body,
      "user-1",
    );

    const req = mockRequest({
      rawBody: Buffer.from(body),
      headers: {
        "x-eck-timestamp": ts,
        "x-eck-signature": sig,
        "x-user-sub": "user-1",
      },
    });

    expect(verifyBffSignature(req).ok).toBe(true);
  });
});
