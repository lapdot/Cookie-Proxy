import type {
  CookieSelectionExplanation,
  CookieSelectionResult,
  CookieSet
} from "../core/types.js";
import { isCookieApplicable } from "./policy.js";

export function selectBestCookieSet(cookieSets: CookieSet[], targetUrl: URL, now = Date.now()): CookieSelectionResult {
  const explanation = cookieSets.map((cookieSet) => scoreCookieSet(cookieSet, targetUrl, now));
  const sorted = [...explanation].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    if (right.matchedCookieCount !== left.matchedCookieCount) {
      return right.matchedCookieCount - left.matchedCookieCount;
    }

    return left.fileName.localeCompare(right.fileName);
  });

  const winner = sorted.find((entry) => entry.score > Number.NEGATIVE_INFINITY);
  if (!winner || winner.matchedCookieCount === 0) {
    return {
      selected: null,
      applicableCookies: [],
      explanation: sorted
    };
  }

  const selected = cookieSets.find((cookieSet) => cookieSet.fileName === winner.fileName) ?? null;
  const applicableCookies = selected
    ? selected.cookies.filter((cookie) => isCookieApplicable(cookie, targetUrl, now))
    : [];

  return {
    selected,
    applicableCookies,
    explanation: sorted
  };
}

function scoreCookieSet(cookieSet: CookieSet, targetUrl: URL, now: number): CookieSelectionExplanation {
  const host = targetUrl.hostname.toLowerCase();
  const exactHostHintMatch = cookieSet.domainHint === host;
  const suffixHintMatch = host === cookieSet.domainHint || host.endsWith(`.${cookieSet.domainHint}`);
  const applicableCookies = cookieSet.cookies.filter((cookie) => isCookieApplicable(cookie, targetUrl, now));
  const rejectedReasons: string[] = [];

  if (applicableCookies.length === 0) {
    rejectedReasons.push("No applicable cookies for target URL");
  }

  if (!suffixHintMatch) {
    rejectedReasons.push("File name hint does not match target host");
  }

  let score = applicableCookies.length * 100;

  if (exactHostHintMatch) {
    score += 10_000;
  } else if (suffixHintMatch) {
    score += 5_000;
  }

  for (const cookie of applicableCookies) {
    if (cookie.domain === host) {
      score += 1000;
    } else if (host.endsWith(`.${cookie.domain}`)) {
      score += 500;
    }

    score += Math.min(cookie.path.length, 100);
  }

  if (applicableCookies.length === 0) {
    score = Number.NEGATIVE_INFINITY;
  }

  return {
    fileName: cookieSet.fileName,
    score,
    matchedCookieCount: applicableCookies.length,
    exactHostHintMatch,
    suffixHintMatch,
    matchedDomains: Array.from(new Set(applicableCookies.map((cookie) => cookie.domain))).sort(),
    rejectedReasons
  };
}
