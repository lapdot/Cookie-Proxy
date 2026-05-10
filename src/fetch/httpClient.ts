import { request } from "undici";
import type { CookieJar } from "tough-cookie";

export interface HttpResponse {
  status: number;
  url: string;
  headers: {
    get(name: string): string | null;
  };
  text(): Promise<string>;
}

export async function fetchWithCookies(
  input: URL,
  cookieJar: CookieJar,
  timeoutMs: number
): Promise<HttpResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const cookieHeader = await cookieJar.getCookieString(input.toString());
    const response = await request(input, {
      method: "GET",
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      signal: controller.signal,
      headersTimeout: timeoutMs,
      bodyTimeout: timeoutMs
    });

    return {
      status: response.statusCode,
      url: input.toString(),
      headers: {
        get(name: string) {
          const value = response.headers[name.toLowerCase()];
          if (Array.isArray(value)) {
            return value.join(", ");
          }

          return value ?? null;
        }
      },
      text() {
        return response.body.text();
      }
    };
  } finally {
    clearTimeout(timeout);
  }
}
