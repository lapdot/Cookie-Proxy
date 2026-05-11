import type { BrowserRequestProfile, BrowserRequestProfileOptions } from "../core/types.js";

const DEFAULT_ACCEPT_LANGUAGE = "en-US,en;q=0.9";
const CHROME_USER_AGENT = [
  "Mozilla/5.0",
  "(Macintosh; Intel Mac OS X 10_15_7)",
  "AppleWebKit/537.36",
  "(KHTML, like Gecko)",
  "Chrome/136.0.0.0",
  "Safari/537.36"
].join(" ");

export function createChromeMacOsProfile(targetUrl: URL, options: BrowserRequestProfileOptions): BrowserRequestProfile {
  const headers: Record<string, string> = {
    "user-agent": CHROME_USER_AGENT,
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "accept-language": options.acceptLanguage ?? DEFAULT_ACCEPT_LANGUAGE,
    "upgrade-insecure-requests": "1",
    "cache-control": "max-age=0",
    pragma: "no-cache",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": getSecFetchSite(targetUrl, options.referer),
    "sec-fetch-user": "?1"
  };

  if (!options.noClientHints) {
    headers["sec-ch-ua"] = "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"";
    headers["sec-ch-ua-mobile"] = "?0";
    headers["sec-ch-ua-platform"] = "\"macOS\"";
  }

  if (options.referer) {
    headers.referer = options.referer;
  }

  return {
    name: "chrome-macos-navigation",
    headers,
    clientHintsEnabled: !options.noClientHints,
    referer: options.referer
  };
}

function getSecFetchSite(targetUrl: URL, referer?: string): string {
  if (!referer) {
    return "none";
  }

  try {
    const refererUrl = new URL(referer);
    if (refererUrl.origin === targetUrl.origin) {
      return "same-origin";
    }

    return refererUrl.hostname === targetUrl.hostname ? "same-site" : "cross-site";
  } catch {
    return "none";
  }
}
