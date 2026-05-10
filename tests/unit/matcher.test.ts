import { describe, expect, it } from "vitest";
import { selectBestCookieSet } from "../../src/cookies/matcher.js";
import type { CookieSet } from "../../src/core/types.js";

const cookieSets: CookieSet[] = [
  {
    filePath: "/tmp/example.com.json",
    fileName: "example.com.json",
    domainHint: "example.com",
    cookies: [
      {
        name: "session",
        value: "root",
        domain: "example.com",
        path: "/",
        secure: true,
        httpOnly: true,
        sameSite: "Lax",
        hostOnly: false,
        expiresAt: null,
        sourceFile: "example.com.json"
      }
    ]
  },
  {
    filePath: "/tmp/app.example.com.json",
    fileName: "app.example.com.json",
    domainHint: "app.example.com",
    cookies: [
      {
        name: "session",
        value: "app",
        domain: "app.example.com",
        path: "/account",
        secure: true,
        httpOnly: true,
        sameSite: "Lax",
        hostOnly: true,
        expiresAt: null,
        sourceFile: "app.example.com.json"
      }
    ]
  },
  {
    filePath: "/tmp/substack.com.json",
    fileName: "substack.com.json",
    domainHint: "substack.com",
    cookies: [
      {
        name: "session",
        value: "network",
        domain: "substack.com",
        path: "/",
        secure: true,
        httpOnly: true,
        sameSite: "Lax",
        hostOnly: false,
        expiresAt: null,
        sourceFile: "substack.com.json"
      }
    ]
  },
  {
    filePath: "/tmp/michaeljburry.substack.com.json",
    fileName: "michaeljburry.substack.com.json",
    domainHint: "michaeljburry.substack.com",
    cookies: [
      {
        name: "session",
        value: "author",
        domain: "michaeljburry.substack.com",
        path: "/p",
        secure: true,
        httpOnly: true,
        sameSite: "Lax",
        hostOnly: true,
        expiresAt: null,
        sourceFile: "michaeljburry.substack.com.json"
      }
    ]
  }
];

describe("selectBestCookieSet", () => {
  it("prefers the most specific matching file", () => {
    const result = selectBestCookieSet(cookieSets, new URL("https://app.example.com/account"));
    expect(result.selected?.fileName).toBe("app.example.com.json");
    expect(result.applicableCookies).toHaveLength(1);
  });

  it("returns no winner when nothing applies", () => {
    const result = selectBestCookieSet(cookieSets, new URL("http://other.test/"));
    expect(result.selected).toBeNull();
    expect(result.applicableCookies).toHaveLength(0);
  });

  it("supports non-Zhihu sites by matching parent domains", () => {
    const result = selectBestCookieSet(
      cookieSets,
      new URL("https://newsletter.substack.com/archive")
    );

    expect(result.selected?.fileName).toBe("substack.com.json");
    expect(result.applicableCookies).toHaveLength(1);
  });

  it("prefers the most specific matching file for multi-tenant hosts", () => {
    const result = selectBestCookieSet(
      cookieSets,
      new URL("https://michaeljburry.substack.com/p/trading-post-friday-may-8-2026")
    );

    expect(result.selected?.fileName).toBe("michaeljburry.substack.com.json");
    expect(result.applicableCookies).toHaveLength(1);
    expect(result.applicableCookies[0]?.value).toBe("author");
  });
});
