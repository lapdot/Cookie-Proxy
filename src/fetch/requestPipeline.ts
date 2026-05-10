import type { CookieSet, FetchResult, FetchStep } from "../core/types.js";
import { createCookieJar } from "../cookies/jar.js";
import { selectBestCookieSet } from "../cookies/matcher.js";
import { fetchWithCookies } from "./httpClient.js";
import type { Logger } from "../utils/logger.js";

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export async function fetchHtmlWithCookies(
  targetUrl: URL,
  cookieSets: CookieSet[],
  timeoutMs: number,
  maxRedirects: number,
  logger: Logger
): Promise<FetchResult> {
  let currentUrl = new URL(targetUrl);
  let redirectsRemaining = maxRedirects;
  const steps: FetchStep[] = [];
  let latestExplanation = selectBestCookieSet(cookieSets, currentUrl).explanation;
  let finalSelectedCookieFile: string | null = null;

  while (true) {
    const selection = selectBestCookieSet(cookieSets, currentUrl);
    latestExplanation = selection.explanation;
    finalSelectedCookieFile = selection.selected?.fileName ?? null;
    const selectedCookies = selection.selected?.cookies ?? [];
    const cookieJar = await createCookieJar(selectedCookies);
    const cookieHeader = await cookieJar.getCookieString(currentUrl.toString());

    logger.debug(
      [
        `Preparing request to ${currentUrl.toString()}`,
        `selectedCookieFile=${finalSelectedCookieFile ?? "none"}`,
        `selectedCookies=${selectedCookies.length}`,
        `cookieHeaderLength=${cookieHeader?.length ?? 0}`,
        `redirectsRemaining=${redirectsRemaining}`
      ].join(" ")
    );

    let response: Awaited<ReturnType<typeof fetchWithCookies>>;
    try {
      response = await fetchWithCookies(currentUrl, cookieJar, timeoutMs);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.debug(`Request to ${currentUrl.toString()} failed: ${message}`);
      throw error;
    }

    const responseUrl = response.url || currentUrl.toString();
    logger.debug(
      [
        `Received response for ${currentUrl.toString()}`,
        `status=${response.status}`,
        `responseUrl=${responseUrl}`
      ].join(" ")
    );
    steps.push({
      requestUrl: currentUrl.toString(),
      responseUrl,
      status: response.status,
      selectedCookieFile: finalSelectedCookieFile
    });

    if (!REDIRECT_STATUSES.has(response.status)) {
      const html = await response.text();
      logger.debug(
        [
          `Returning final response for ${currentUrl.toString()}`,
          `status=${response.status}`,
          `htmlLength=${html.length}`
        ].join(" ")
      );
      return {
        html,
        finalUrl: responseUrl,
        status: response.status,
        selectedCookieFile: finalSelectedCookieFile,
        steps,
        selectionExplanation: latestExplanation
      };
    }

    if (redirectsRemaining === 0) {
      throw new Error(`Maximum redirects exceeded while requesting ${targetUrl.toString()}`);
    }

    const location = response.headers.get("location");
    if (!location) {
      throw new Error(`Received redirect status ${response.status} without a location header`);
    }

    logger.debug(
      `Following redirect from ${currentUrl.toString()} to ${new URL(location, currentUrl).toString()} status=${response.status}`
    );
    currentUrl = new URL(location, currentUrl);
    redirectsRemaining -= 1;
  }
}
