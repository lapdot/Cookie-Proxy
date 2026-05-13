import { describe, expect, it } from "vitest";
import { CookieNormalizationError } from "../../src/core/errors.js";
import type { CookieFile, RawCookieRecord } from "../../src/core/types.js";
import { normalizeCookieFiles } from "../../src/cookies/normalizer.js";

function createCookieFile(cookies: RawCookieRecord[]): CookieFile {
  return {
    filePath: "/cookies/example.com.json",
    fileName: "example.com.json",
    domainHint: "example.com",
    cookies
  };
}

function createCookie(overrides: RawCookieRecord = {}): RawCookieRecord {
  return {
    name: "session",
    value: "abc",
    domain: ".example.com",
    path: "/",
    sameSite: "unspecified",
    ...overrides
  };
}

describe("normalizeCookieFiles", () => {
  it("drops cookie records with an empty string name", () => {
    const [cookieSet] = normalizeCookieFiles([
      createCookieFile([
        createCookie({ name: "" }),
        createCookie({ name: "kept" })
      ])
    ]);

    expect(cookieSet?.cookies).toHaveLength(1);
    expect(cookieSet?.cookies[0]?.name).toBe("kept");
  });

  it("drops cookie records with a whitespace-only name", () => {
    const [cookieSet] = normalizeCookieFiles([
      createCookieFile([
        createCookie({ name: "   " }),
        createCookie({ name: "kept" })
      ])
    ]);

    expect(cookieSet?.cookies).toHaveLength(1);
    expect(cookieSet?.cookies[0]?.name).toBe("kept");
  });

  it("continues to apply strict validation to surviving records", () => {
    expect(() => normalizeCookieFiles([
      createCookieFile([
        createCookie({ name: "" }),
        createCookie({ name: "invalid-expiry", expirationDate: "not-a-date" })
      ])
    ])).toThrow("Cookie has an invalid expiration field");
  });

  it("still rejects records with a missing name", () => {
    const cookie = createCookie();
    delete cookie.name;

    expect(() => normalizeCookieFiles([createCookieFile([cookie])])).toThrow(CookieNormalizationError);
    expect(() => normalizeCookieFiles([createCookieFile([cookie])])).toThrow(
      "Cookie is missing required string field name"
    );
  });

  it("still rejects records with a non-string name", () => {
    expect(() => normalizeCookieFiles([
      createCookieFile([createCookie({ name: 123 })])
    ])).toThrow(CookieNormalizationError);
    expect(() => normalizeCookieFiles([
      createCookieFile([createCookie({ name: 123 })])
    ])).toThrow("Cookie is missing required string field name");
  });
});
