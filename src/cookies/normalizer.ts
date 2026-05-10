import { CookieNormalizationError } from "../core/errors.js";
import type { CookieFile, CookieSet, NormalizedCookie, RawCookieRecord } from "../core/types.js";
import { normalizeSameSite } from "./policy.js";
import { normalizeHostname } from "../utils/url.js";

export function normalizeCookieFiles(files: CookieFile[]): CookieSet[] {
  return files.map((file) => ({
    filePath: file.filePath,
    fileName: file.fileName,
    domainHint: file.domainHint,
    cookies: file.cookies.map((cookie, index) => normalizeCookie(cookie, file.fileName, index))
  }));
}

export function normalizeCookie(raw: RawCookieRecord, sourceFile: string, index: number): NormalizedCookie {
  const name = getRequiredString(raw, ["name"]);
  const value = getOptionalString(raw, ["value"]) ?? "";
  const originalDomain = getRequiredString(raw, ["domain"]);
  const path = getOptionalString(raw, ["path"]) ?? "/";
  const secure = getOptionalBoolean(raw, ["secure"]);
  const httpOnly = getOptionalBoolean(raw, ["httpOnly", "http_only"]);
  const sameSite = normalizeSameSite(raw.sameSite);
  const expiresAt = getExpiryTimestamp(raw);
  const hostOnly = getOptionalBoolean(raw, ["hostOnly", "host_only"]) || !originalDomain.trim().startsWith(".");

  return {
    name,
    value,
    domain: normalizeHostname(originalDomain),
    path,
    secure,
    httpOnly,
    sameSite,
    hostOnly,
    expiresAt,
    sourceFile
  };
}

function getRequiredString(record: RawCookieRecord, keys: string[]): string {
  const value = getFirstDefined(record, keys);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new CookieNormalizationError(`Cookie is missing required string field ${keys[0]}`);
  }

  return value;
}

function getOptionalString(record: RawCookieRecord, keys: string[]): string | undefined {
  const value = getFirstDefined(record, keys);
  return typeof value === "string" ? value : undefined;
}

function getOptionalBoolean(record: RawCookieRecord, keys: string[]): boolean {
  const value = getFirstDefined(record, keys);
  return value === true;
}

function getExpiryTimestamp(record: RawCookieRecord): number | null {
  const rawValue = getFirstDefined(record, ["expirationDate", "expires", "expiry"]);

  if (rawValue === undefined || rawValue === null) {
    return null;
  }

  if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
    return rawValue > 10_000_000_000 ? rawValue : Math.trunc(rawValue * 1000);
  }

  if (typeof rawValue === "string" && rawValue.trim().length > 0) {
    const asNumber = Number(rawValue);
    if (Number.isFinite(asNumber)) {
      return asNumber > 10_000_000_000 ? asNumber : Math.trunc(asNumber * 1000);
    }

    const asDate = Date.parse(rawValue);
    if (!Number.isNaN(asDate)) {
      return asDate;
    }
  }

  throw new CookieNormalizationError("Cookie has an invalid expiration field");
}

function getFirstDefined(record: RawCookieRecord, keys: string[]): unknown {
  for (const key of keys) {
    if (key in record) {
      return record[key];
    }
  }

  return undefined;
}
