import { Cookie, CookieJar } from "tough-cookie";
import type { NormalizedCookie } from "../core/types.js";

export function toToughCookie(cookie: NormalizedCookie): Cookie {
  return new Cookie({
    key: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path || "/",
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    hostOnly: cookie.hostOnly,
    expires: cookie.expiresAt === null ? "Infinity" : new Date(cookie.expiresAt)
  });
}

export async function createCookieJar(cookies: NormalizedCookie[]): Promise<CookieJar> {
  const jar = new CookieJar(undefined, {
    rejectPublicSuffixes: false
  });

  for (const cookie of cookies) {
    await jar.setCookie(toToughCookie(cookie), getCookieSourceUrl(cookie));
  }

  return jar;
}

function getCookieSourceUrl(cookie: NormalizedCookie): string {
  const protocol = cookie.secure ? "https" : "http";
  const path = cookie.path || "/";
  return `${protocol}://${cookie.domain}${path}`;
}
