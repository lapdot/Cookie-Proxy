import type { CookieSet, FetchResult, FetchStep } from "../core/types.js";
import { buildCookieHeader, selectBestCookieSet } from "../cookies/matcher.js";
import { fetchWithTimeout } from "./httpClient.js";

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export async function fetchHtmlWithCookies(
  targetUrl: URL,
  cookieSets: CookieSet[],
  timeoutMs: number,
  maxRedirects: number
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
    const cookieHeader = selection.applicableCookies.length > 0
      ? buildCookieHeader(selection.applicableCookies)
      : undefined;

    const response = await fetchWithTimeout(currentUrl, {
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
      redirect: "manual"
    }, timeoutMs);

    const responseUrl = response.url || currentUrl.toString();
    steps.push({
      requestUrl: currentUrl.toString(),
      responseUrl,
      status: response.status,
      selectedCookieFile: finalSelectedCookieFile
    });

    if (!REDIRECT_STATUSES.has(response.status)) {
      const html = await response.text();
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

    currentUrl = new URL(location, currentUrl);
    redirectsRemaining -= 1;
  }
}
