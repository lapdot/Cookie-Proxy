import { describe, expect, it } from "vitest";
import { domainMatches, isCookieApplicable, normalizeSameSite, pathMatches } from "../../src/cookies/policy.js";
import type { NormalizedCookie } from "../../src/core/types.js";

function createCookie(overrides: Partial<NormalizedCookie> = {}): NormalizedCookie {
  return {
    name: "session",
    value: "abc",
    domain: "example.com",
    path: "/",
    secure: false,
    httpOnly: true,
    sameSite: "Lax",
    hostOnly: false,
    expiresAt: null,
    sourceFile: "example.com.json",
    ...overrides
  };
}

describe("normalizeSameSite", () => {
  it("maps unspecified to Lax", () => {
    expect(normalizeSameSite("unspecified")).toBe("Lax");
  });

  it("maps no_restriction to None", () => {
    expect(normalizeSameSite("no_restriction")).toBe("None");
  });
});

describe("cookie applicability", () => {
  it("matches subdomains for non-host-only cookies", () => {
    const cookie = createCookie({ domain: "example.com", hostOnly: false });
    expect(domainMatches(cookie, new URL("https://app.example.com/account"))).toBe(true);
  });

  it("requires exact host for host-only cookies", () => {
    const cookie = createCookie({ domain: "example.com", hostOnly: true });
    expect(domainMatches(cookie, new URL("https://app.example.com/account"))).toBe(false);
  });

  it("checks path prefixes", () => {
    const cookie = createCookie({ path: "/account" });
    expect(pathMatches(cookie, new URL("https://example.com/account/settings"))).toBe(true);
    expect(pathMatches(cookie, new URL("https://example.com/profile"))).toBe(false);
  });

  it("rejects secure cookies over http", () => {
    const cookie = createCookie({ secure: true });
    expect(isCookieApplicable(cookie, new URL("http://example.com"))).toBe(false);
  });
});
