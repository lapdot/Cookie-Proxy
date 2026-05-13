import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchResponseWithCookies } from "../../src/fetch/requestPipeline.js";
import type { BrowserRequestProfileOptions, CookieSet } from "../../src/core/types.js";
import { createLogger } from "../../src/utils/logger.js";
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

function createResponse(status: number, body: string | Buffer, headers: Record<string, string> = {}): HttpResponse {
  const normalizedHeaders = new Map(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );
  const bodyBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body, "utf8");

  return {
    status,
    url: "mock://response",
    headers: {
      get(name: string) {
        return normalizedHeaders.get(name.toLowerCase()) ?? null;
      }
    },
    async bytes() {
      return bodyBuffer;
    }
  };
}

const defaultBrowserOptions: BrowserRequestProfileOptions = {
  noClientHints: false
};

describe("fetchResponseWithCookies", () => {
  beforeEach(() => {
    fetchWithCookiesMock.mockReset();
  });

  it("loads the selected cookie file into the jar for the first request", async () => {
    fetchWithCookiesMock.mockImplementation(async ({ url, headers }: { url: URL; headers: Record<string, string> }) => {
      expect(url.toString()).toBe("http://example.com/");
      expect(headers.cookie).toBe("session=example.com");
      expect(headers["user-agent"]).toContain("Chrome/");
      expect(headers["sec-fetch-site"]).toBe("none");
      expect(headers.referer).toBeUndefined();
      return createResponse(200, "<html>ok</html>");
    });

    const result = await fetchResponseWithCookies(
      new URL("http://example.com/"),
      [createCookieSet("example.com.json", "example.com")],
      1_000,
      3,
      defaultBrowserOptions,
      createLogger(false)
    );

    expect(result.selectedCookieFile).toBe("example.com.json");
    expect(result.body.toString("utf8")).toContain("ok");
  });

  it("returns final response bytes and content type without text conversion", async () => {
    const pdfBytes = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x00, 0xff]);
    fetchWithCookiesMock.mockResolvedValue(createResponse(200, pdfBytes, {
      "content-type": "application/pdf"
    }));

    const result = await fetchResponseWithCookies(
      new URL("http://example.com/file.pdf"),
      [createCookieSet("example.com.json", "example.com")],
      1_000,
      3,
      defaultBrowserOptions,
      createLogger(false)
    );

    expect(result.contentType).toBe("application/pdf");
    expect(result.body).toEqual(pdfBytes);
  });

  it("reselects cookies when redirects change hosts", async () => {
    fetchWithCookiesMock
      .mockImplementationOnce(async ({ url, headers }: { url: URL; headers: Record<string, string> }) => {
        expect(url.hostname).toBe("127.0.0.1");
        expect(headers.cookie).toBe("session=127.0.0.1");
        expect(headers["sec-fetch-site"]).toBe("none");
        expect(headers.referer).toBeUndefined();
        return createResponse(302, "", { location: "http://localhost/final" });
      })
      .mockImplementationOnce(async ({ url, headers }: { url: URL; headers: Record<string, string> }) => {
        expect(url.hostname).toBe("localhost");
        expect(headers.cookie).toBe("session=localhost");
        expect(headers["sec-fetch-site"]).toBe("none");
        expect(headers.referer).toBeUndefined();
        return createResponse(200, "<html>localhost</html>");
      });

    const result = await fetchResponseWithCookies(
      new URL("http://127.0.0.1/start"),
      [
        createCookieSet("127.0.0.1.json", "127.0.0.1"),
        createCookieSet("localhost.json", "localhost")
      ],
      1_000,
      3,
      defaultBrowserOptions,
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
      fetchResponseWithCookies(
        new URL("http://example.com/"),
        [createCookieSet("example.com.json", "example.com")],
        1_000,
        3,
        defaultBrowserOptions,
        createLogger(false)
      )
    ).rejects.toThrow("without a location header");
  });

  it("surfaces request failures", async () => {
    fetchWithCookiesMock.mockRejectedValue(new Error("timeout"));

    await expect(
      fetchResponseWithCookies(
        new URL("http://example.com/"),
        [createCookieSet("example.com.json", "example.com")],
        1_000,
        3,
        defaultBrowserOptions,
        createLogger(false)
      )
    ).rejects.toThrow("timeout");
  });

  it("preserves an explicit referer across redirect hops", async () => {
    fetchWithCookiesMock
      .mockImplementationOnce(async ({ headers }: { headers: Record<string, string> }) => {
        expect(headers.referer).toBe("https://example.com/start");
        expect(headers["sec-fetch-site"]).toBe("cross-site");
        return createResponse(302, "", { location: "http://localhost/final" });
      })
      .mockImplementationOnce(async ({ headers }: { headers: Record<string, string> }) => {
        expect(headers.referer).toBe("https://example.com/start");
        expect(headers["sec-fetch-site"]).toBe("cross-site");
        return createResponse(200, "<html>ok</html>");
      });

    await fetchResponseWithCookies(
      new URL("http://127.0.0.1/start"),
      [
        createCookieSet("127.0.0.1.json", "127.0.0.1"),
        createCookieSet("localhost.json", "localhost")
      ],
      1_000,
      3,
      {
        noClientHints: false,
        referer: "https://example.com/start"
      },
      createLogger(false)
    );
  });
});
