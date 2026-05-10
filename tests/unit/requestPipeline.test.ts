import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchHtmlWithCookies } from "../../src/fetch/requestPipeline.js";
import type { CookieSet } from "../../src/core/types.js";
import { createLogger } from "../../src/utils/logger.js";
import type { CookieJar } from "tough-cookie";
import type { HttpResponse } from "../../src/fetch/httpClient.js";

const fetchWithCookiesMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/fetch/httpClient.js", () => ({
  fetchWithCookies: fetchWithCookiesMock
}));

function createCookieSet(fileName: string, domainHint: string, cookieDomain = domainHint): CookieSet {
  return {
    filePath: `/tmp/${fileName}`,
    fileName,
    domainHint,
    cookies: [
      {
        name: "session",
        value: domainHint,
        domain: cookieDomain,
        path: "/",
        secure: false,
        httpOnly: true,
        sameSite: "Lax",
        hostOnly: true,
        expiresAt: null,
        sourceFile: fileName
      }
    ]
  };
}

function createResponse(status: number, body: string, headers: Record<string, string> = {}): HttpResponse {
  const normalizedHeaders = new Map(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );

  return {
    status,
    url: "mock://response",
    headers: {
      get(name: string) {
        return normalizedHeaders.get(name.toLowerCase()) ?? null;
      }
    },
    async text() {
      return body;
    }
  };
}

async function getCookieHeader(jar: CookieJar, url: URL): Promise<string> {
  return jar.getCookieString(url.toString());
}

describe("fetchHtmlWithCookies", () => {
  beforeEach(() => {
    fetchWithCookiesMock.mockReset();
  });

  it("loads the selected cookie file into the jar for the first request", async () => {
    fetchWithCookiesMock.mockImplementation(async (url: URL, jar: CookieJar) => {
      expect(url.toString()).toBe("http://example.com/");
      expect(await getCookieHeader(jar, url)).toBe("session=example.com");
      return createResponse(200, "<html>ok</html>");
    });

    const result = await fetchHtmlWithCookies(
      new URL("http://example.com/"),
      [createCookieSet("example.com.json", "example.com")],
      1_000,
      3,
      createLogger(false)
    );

    expect(result.selectedCookieFile).toBe("example.com.json");
    expect(result.html).toContain("ok");
  });

  it("reselects cookies when redirects change hosts", async () => {
    fetchWithCookiesMock
      .mockImplementationOnce(async (url: URL, jar: CookieJar) => {
        expect(url.hostname).toBe("127.0.0.1");
        expect(await getCookieHeader(jar, url)).toBe("session=127.0.0.1");
        return createResponse(302, "", { location: "http://localhost/final" });
      })
      .mockImplementationOnce(async (url: URL, jar: CookieJar) => {
        expect(url.hostname).toBe("localhost");
        expect(await getCookieHeader(jar, url)).toBe("session=localhost");
        return createResponse(200, "<html>localhost</html>");
      });

    const result = await fetchHtmlWithCookies(
      new URL("http://127.0.0.1/start"),
      [
        createCookieSet("127.0.0.1.json", "127.0.0.1"),
        createCookieSet("localhost.json", "localhost")
      ],
      1_000,
      3,
      createLogger(false)
    );

    expect(result.selectedCookieFile).toBe("localhost.json");
    expect(result.steps).toEqual([
      {
        requestUrl: "http://127.0.0.1/start",
        responseUrl: "mock://response",
        status: 302,
        selectedCookieFile: "127.0.0.1.json"
      },
      {
        requestUrl: "http://localhost/final",
        responseUrl: "mock://response",
        status: 200,
        selectedCookieFile: "localhost.json"
      }
    ]);
  });

  it("throws when a redirect response has no location header", async () => {
    fetchWithCookiesMock.mockResolvedValue(createResponse(302, ""));

    await expect(
      fetchHtmlWithCookies(
        new URL("http://example.com/"),
        [createCookieSet("example.com.json", "example.com")],
        1_000,
        3,
        createLogger(false)
      )
    ).rejects.toThrow("without a location header");
  });

  it("surfaces request failures", async () => {
    fetchWithCookiesMock.mockRejectedValue(new Error("timeout"));

    await expect(
      fetchHtmlWithCookies(
        new URL("http://example.com/"),
        [createCookieSet("example.com.json", "example.com")],
        1_000,
        3,
        createLogger(false)
      )
    ).rejects.toThrow("timeout");
  });
});
