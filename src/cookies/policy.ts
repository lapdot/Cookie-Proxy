import type { NormalizedCookie, NormalizedSameSite } from "../core/types.js";
import { normalizeHostname } from "../utils/url.js";

export function normalizeSameSite(input: unknown): NormalizedSameSite {
  if (typeof input !== "string" || input.trim().length === 0) {
    return "Lax";
  }

  const normalized = input.trim().toLowerCase();

  if (normalized === "unspecified") {
    return "Lax";
  }

  if (normalized === "no_restriction" || normalized === "none") {
    return "None";
  }

  if (normalized === "strict") {
    return "Strict";
  }

  return "Lax";
}

export function isCookieExpired(cookie: NormalizedCookie, now = Date.now()): boolean {
  return cookie.expiresAt !== null && cookie.expiresAt <= now;
}

export function domainMatches(cookie: NormalizedCookie, targetUrl: URL): boolean {
  const host = normalizeHostname(targetUrl.hostname);
  const domain = normalizeHostname(cookie.domain);

  if (cookie.hostOnly) {
    return host === domain;
  }

  return host === domain || host.endsWith(`.${domain}`);
}

export function pathMatches(cookie: NormalizedCookie, targetUrl: URL): boolean {
  const requestPath = targetUrl.pathname || "/";
  const cookiePath = cookie.path || "/";

  if (requestPath === cookiePath) {
    return true;
  }

  if (!requestPath.startsWith(cookiePath)) {
    return false;
  }

  if (cookiePath.endsWith("/")) {
    return true;
  }

  return requestPath.charAt(cookiePath.length) === "/";
}

export function secureMatches(cookie: NormalizedCookie, targetUrl: URL): boolean {
  return !cookie.secure || targetUrl.protocol === "https:";
}

export function isCookieApplicable(cookie: NormalizedCookie, targetUrl: URL, now = Date.now()): boolean {
  return !isCookieExpired(cookie, now)
    && domainMatches(cookie, targetUrl)
    && pathMatches(cookie, targetUrl)
    && secureMatches(cookie, targetUrl);
}
