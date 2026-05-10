export type NormalizedSameSite = "Lax" | "Strict" | "None";

export interface RawCookieRecord {
  [key: string]: unknown;
}

export interface CookieFile {
  filePath: string;
  fileName: string;
  domainHint: string;
  cookies: RawCookieRecord[];
}

export interface NormalizedCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: NormalizedSameSite;
  hostOnly: boolean;
  expiresAt: number | null;
  sourceFile: string;
}

export interface CookieSet {
  filePath: string;
  fileName: string;
  domainHint: string;
  cookies: NormalizedCookie[];
}

export interface CookieSelectionExplanation {
  fileName: string;
  score: number;
  matchedCookieCount: number;
  exactHostHintMatch: boolean;
  suffixHintMatch: boolean;
  matchedDomains: string[];
  rejectedReasons: string[];
}

export interface CookieSelectionResult {
  selected: CookieSet | null;
  applicableCookies: NormalizedCookie[];
  explanation: CookieSelectionExplanation[];
}

export interface CliOptions {
  cookiesDir: string;
  url: string;
  outputPath?: string;
  timeoutMs: number;
  maxRedirects: number;
  verbose: boolean;
  debugCookieMatch: boolean;
}

export interface FetchStep {
  requestUrl: string;
  responseUrl: string;
  status: number;
  selectedCookieFile: string | null;
}

export interface FetchResult {
  html: string;
  finalUrl: string;
  status: number;
  selectedCookieFile: string | null;
  steps: FetchStep[];
  selectionExplanation: CookieSelectionExplanation[];
}
