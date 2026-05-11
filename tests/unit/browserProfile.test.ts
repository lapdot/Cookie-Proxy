import { describe, expect, it } from "vitest";
import { createChromeMacOsProfile } from "../../src/fetch/browserProfile.js";

describe("createChromeMacOsProfile", () => {
  it("builds the default Chrome macOS navigation header set", () => {
    const profile = createChromeMacOsProfile(new URL("https://example.com/"), {
      noClientHints: false
    });

    expect(profile.name).toBe("chrome-macos-navigation");
    expect(profile.clientHintsEnabled).toBe(true);
    expect(profile.referer).toBeUndefined();
    expect(profile.headers["user-agent"]).toContain("Chrome/136.0.0.0");
    expect(profile.headers.accept).toContain("text/html");
    expect(profile.headers["accept-language"]).toBe("en-US,en;q=0.9");
    expect(profile.headers["accept-encoding"]).toBeUndefined();
    expect(profile.headers["upgrade-insecure-requests"]).toBe("1");
    expect(profile.headers["sec-fetch-site"]).toBe("none");
    expect(profile.headers["sec-fetch-mode"]).toBe("navigate");
    expect(profile.headers["sec-fetch-user"]).toBe("?1");
    expect(profile.headers.cookie).toBeUndefined();
    expect(profile.headers["sec-ch-ua"]).toContain("Chromium");
    expect(profile.headers["sec-ch-ua-mobile"]).toBe("?0");
    expect(profile.headers["sec-ch-ua-platform"]).toBe("\"macOS\"");
  });

  it("omits client hint headers when disabled", () => {
    const profile = createChromeMacOsProfile(new URL("https://example.com/"), {
      noClientHints: true
    });

    expect(profile.clientHintsEnabled).toBe(false);
    expect(profile.headers["sec-ch-ua"]).toBeUndefined();
    expect(profile.headers["sec-ch-ua-mobile"]).toBeUndefined();
    expect(profile.headers["sec-ch-ua-platform"]).toBeUndefined();
    expect(profile.headers["user-agent"]).toBeDefined();
  });

  it("adds referer and computes same-origin fetch metadata", () => {
    const profile = createChromeMacOsProfile(new URL("https://example.com/target"), {
      noClientHints: false,
      referer: "https://example.com/source",
      acceptLanguage: "en-GB,en;q=0.8"
    });

    expect(profile.referer).toBe("https://example.com/source");
    expect(profile.headers.referer).toBe("https://example.com/source");
    expect(profile.headers["accept-language"]).toBe("en-GB,en;q=0.8");
    expect(profile.headers["sec-fetch-site"]).toBe("same-origin");
  });
});
