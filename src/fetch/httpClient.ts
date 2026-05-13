import { request } from "undici";

export interface HttpResponse {
  status: number;
  url: string;
  headers: {
    get(name: string): string | null;
  };
  bytes(): Promise<Buffer>;
}

export interface HttpRequestOptions {
  url: URL;
  headers: Record<string, string>;
  timeoutMs: number;
}

export async function fetchWithCookies(
  options: HttpRequestOptions
): Promise<HttpResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await request(options.url, {
      method: "GET",
      headers: options.headers,
      signal: controller.signal,
      headersTimeout: options.timeoutMs,
      bodyTimeout: options.timeoutMs
    });

    return {
      status: response.statusCode,
      url: options.url.toString(),
      headers: {
        get(name: string) {
          const value = response.headers[name.toLowerCase()];
          if (Array.isArray(value)) {
            return value.join(", ");
          }

          return value ?? null;
        }
      },
      async bytes() {
        return Buffer.from(await response.body.arrayBuffer());
      }
    };
  } finally {
    clearTimeout(timeout);
  }
}
