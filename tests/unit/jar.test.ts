import { describe, expect, it } from "vitest";
import { createCookieJar, toToughCookie } from "../../src/cookies/jar.js";
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

describe("toToughCookie", () => {
  it("preserves host-only cookies", () => {
    const cookie = toToughCookie(createCookie({ hostOnly: true }));
    expect(cookie.hostOnly).toBe(true);
    expect(cookie.domain).toBe("example.com");
  });

  it("preserves domain cookies", () => {
    const cookie = toToughCookie(createCookie({ hostOnly: false, domain: "example.com" }));
    expect(cookie.hostOnly).toBe(false);
    expect(cookie.domain).toBe("example.com");
  });

  it("maps expiry timestamps to dates", () => {
    const cookie = toToughCookie(createCookie({ expiresAt: 1_700_000_000_000 }));
    expect(cookie.expires).toBeInstanceOf(Date);
    expect((cookie.expires as Date).getTime()).toBe(1_700_000_000_000);
  });

  it("defaults the path to root", () => {
    const cookie = toToughCookie(createCookie({ path: "" }));
    expect(cookie.path).toBe("/");
  });
});

describe("createCookieJar", () => {
  it("does not send expired cookies", async () => {
    const jar = await createCookieJar([
      createCookie({ expiresAt: Date.now() - 60_000 })
    ]);

    expect(await jar.getCookieString("http://example.com/")).toBe("");
  });

  it("only sends secure cookies over https", async () => {
    const jar = await createCookieJar([
      createCookie({ secure: true })
    ]);

    expect(await jar.getCookieString("http://example.com/")).toBe("");
    expect(await jar.getCookieString("https://example.com/")).toBe("session=abc");
  });
});
