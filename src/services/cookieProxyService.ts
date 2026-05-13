import type { CliOptions, FetchResult } from "../core/types.js";
import { loadCookieFiles } from "../cookies/loader.js";
import { normalizeCookieFiles } from "../cookies/normalizer.js";
import { fetchResponseWithCookies } from "../fetch/requestPipeline.js";
import { ensureUrl } from "../utils/url.js";
import type { Logger } from "../utils/logger.js";

export async function runCookieProxy(options: CliOptions, logger: Logger): Promise<FetchResult> {
  const targetUrl = ensureUrl(options.url);

  logger.info(`Loading cookies from ${options.cookiesDir}`);
  const cookieFiles = await loadCookieFiles(options.cookiesDir);
  const cookieSets = normalizeCookieFiles(cookieFiles);

  logger.info(`Loaded ${cookieSets.length} cookie file(s)`);
  logger.info(`Fetching ${targetUrl.toString()}`);

  return fetchResponseWithCookies(
    targetUrl,
    cookieSets,
    options.timeoutMs,
    options.maxRedirects,
    {
      referer: options.referer,
      acceptLanguage: options.acceptLanguage,
      noClientHints: options.noClientHints
    },
    logger
  );
}
