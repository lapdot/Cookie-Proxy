import { CliUsageError } from "../core/errors.js";
import type { CliOptions } from "../core/types.js";

const DEFAULT_COOKIES_DIR = "/Users/lapdot/Documents/projects/workspace/configs/cookies";

const HELP_TEXT = `CookieProxy

Usage:
  cookieproxy --url <url> [options]

Options:
  --cookies <dir>            Directory containing JSON cookie files (default: /Users/lapdot/Documents/projects/workspace/configs/cookies)
  --url <url>                Target URL to request
  --output <file>            Write response body to a file instead of stdout
  --timeout <ms>             Request timeout in milliseconds (default: 30000)
  --max-redirects <n>        Maximum redirect hops to follow (default: 5)
  --referer <url>            Send an explicit Referer header for the request chain
  --accept-language <value>  Override the browser-like Accept-Language header
  --no-client-hints          Disable sec-ch-ua* browser client hint headers
  --verbose                  Print progress diagnostics to stderr
  --debug-cookie-match       Print cookie selection reasoning to stderr
  --help                     Show this message
`;

export function parseArgs(argv: string[]): CliOptions {
  const values = new Map<string, string | boolean>();

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--help") {
      throw new CliUsageError(HELP_TEXT);
    }

    if (token === "--verbose" || token === "--debug-cookie-match" || token === "--no-client-hints") {
      values.set(token, true);
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      throw new CliUsageError(`Missing value for ${token}\n\n${HELP_TEXT}`);
    }

    values.set(token, next);
    index += 1;
  }

  const cookiesDir = getOptionalString(values, "--cookies") ?? DEFAULT_COOKIES_DIR;
  const url = getRequiredString(values, "--url");
  const outputPath = getOptionalString(values, "--output");
  const timeoutMs = getOptionalNumber(values, "--timeout", 30000);
  const maxRedirects = getOptionalNumber(values, "--max-redirects", 5);

  if (timeoutMs <= 0) {
    throw new CliUsageError("--timeout must be a positive integer");
  }

  if (maxRedirects < 0) {
    throw new CliUsageError("--max-redirects must be zero or greater");
  }

  return {
    cookiesDir,
    url,
    outputPath,
    timeoutMs,
    maxRedirects,
    referer: getOptionalString(values, "--referer"),
    acceptLanguage: getOptionalString(values, "--accept-language"),
    noClientHints: values.get("--no-client-hints") === true,
    verbose: values.get("--verbose") === true,
    debugCookieMatch: values.get("--debug-cookie-match") === true
  };
}

function getRequiredString(values: Map<string, string | boolean>, key: string): string {
  const value = values.get(key);
  if (typeof value !== "string" || value.length === 0) {
    throw new CliUsageError(`Missing required option ${key}\n\n${HELP_TEXT}`);
  }

  return value;
}

function getOptionalString(values: Map<string, string | boolean>, key: string): string | undefined {
  const value = values.get(key);
  return typeof value === "string" ? value : undefined;
}

function getOptionalNumber(values: Map<string, string | boolean>, key: string, fallback: number): number {
  const value = values.get(key);
  if (value === undefined) {
    return fallback;
  }

  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new CliUsageError(`${key} must be an integer`);
  }

  return Number(value);
}

export function getHelpText(): string {
  return HELP_TEXT;
}
