import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import http from "node:http";
import { fileURLToPath } from "node:url";

const testFilePath = fileURLToPath(import.meta.url);
const testDirectory = path.dirname(testFilePath);

let server: http.Server;
let baseUrl = "";
let localhostUrl = "";

beforeAll(async () => {
  server = http.createServer((request, response) => {
    if (request.url === "/headers") {
      response.statusCode = 200;
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.end(JSON.stringify({
        cookie: request.headers.cookie ?? null,
        userAgent: request.headers["user-agent"] ?? null,
        accept: request.headers.accept ?? null,
        acceptLanguage: request.headers["accept-language"] ?? null,
        acceptEncoding: request.headers["accept-encoding"] ?? null,
        secChUa: request.headers["sec-ch-ua"] ?? null,
        secFetchSite: request.headers["sec-fetch-site"] ?? null,
        secFetchMode: request.headers["sec-fetch-mode"] ?? null,
        secFetchUser: request.headers["sec-fetch-user"] ?? null,
        referer: request.headers.referer ?? null
      }));
      return;
    }

    if (request.url === "/redirect") {
      response.statusCode = 302;
      response.setHeader("Location", "/final");
      response.end();
      return;
    }

    if (request.url === "/redirect-to-localhost") {
      response.statusCode = 302;
      response.setHeader("Location", `${localhostUrl}/final`);
      response.end();
      return;
    }

    if (request.url === "/redirect-pdf-to-localhost") {
      response.statusCode = 302;
      response.setHeader("Location", `${localhostUrl}/pdf`);
      response.end();
      return;
    }

    if (request.url === "/pdf") {
      response.statusCode = 200;
      response.setHeader("Content-Type", "application/pdf");
      response.end(Buffer.from(`%PDF-${request.headers.cookie ?? "no-cookie"}`, "utf8"));
      return;
    }

    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end(`<html><body>${request.headers.cookie ?? "no-cookie"}</body></html>`);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind local test server");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
  localhostUrl = `http://localhost:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

describe("CLI integration", () => {
  it("loads cookies, follows redirects, and prints HTML", async () => {
    const cookiesDir = await mkdtemp(path.join(tmpdir(), "cookieproxy-"));
    const cookieFile = path.join(cookiesDir, "127.0.0.1.json");

    await writeFile(cookieFile, JSON.stringify([
      {
        name: "session",
        value: "integration",
        domain: "127.0.0.1",
        path: "/",
        secure: false,
        httpOnly: true,
        sameSite: "unspecified"
      }
    ]), "utf8");

    try {
      const output = await runCli([
        "src/cli/index.ts",
        "--cookies",
        cookiesDir,
        "--url",
        `${baseUrl}/redirect`
      ]);

      expect(output.exitCode).toBe(0);
      expect(output.stdout).toContain("session=integration");
      expect(output.stderr).toBe("");
    } finally {
      await rm(cookiesDir, { recursive: true, force: true });
    }
  });

  it("reselects cookies when a redirect changes hosts", async () => {
    const cookiesDir = await mkdtemp(path.join(tmpdir(), "cookieproxy-"));
    const loopbackCookieFile = path.join(cookiesDir, "127.0.0.1.json");
    const localhostCookieFile = path.join(cookiesDir, "localhost.json");

    await writeFile(loopbackCookieFile, JSON.stringify([
      {
        name: "session",
        value: "loopback",
        domain: "127.0.0.1",
        path: "/",
        secure: false,
        httpOnly: true,
        sameSite: "unspecified"
      }
    ]), "utf8");

    await writeFile(localhostCookieFile, JSON.stringify([
      {
        name: "session",
        value: "localhost",
        domain: "localhost",
        path: "/",
        secure: false,
        httpOnly: true,
        sameSite: "unspecified"
      }
    ]), "utf8");

    try {
      const output = await runCli([
        "src/cli/index.ts",
        "--cookies",
        cookiesDir,
        "--url",
        `${baseUrl}/redirect-to-localhost`
      ]);

      expect(output.exitCode).toBe(0);
      expect(output.stdout).toContain("session=localhost");
      expect(output.stdout).not.toContain("session=loopback");
      expect(output.stderr).toBe("");
    } finally {
      await rm(cookiesDir, { recursive: true, force: true });
    }
  });

  it("sends browser-like headers by default", async () => {
    const cookiesDir = await mkdtemp(path.join(tmpdir(), "cookieproxy-"));
    const cookieFile = path.join(cookiesDir, "other.test.json");

    try {
      await writeFile(cookieFile, JSON.stringify([
        {
          name: "session",
          value: "other",
          domain: "other.test",
          path: "/",
          secure: false,
          httpOnly: true,
          sameSite: "unspecified"
        }
      ]), "utf8");

      const output = await runCli([
        "src/cli/index.ts",
        "--cookies",
        cookiesDir,
        "--url",
        `${baseUrl}/headers`
      ]);

      expect(output.exitCode).toBe(0);
      expect(JSON.parse(output.stdout)).toMatchObject({
        cookie: null,
        acceptLanguage: "en-US,en;q=0.9",
        acceptEncoding: null,
        secFetchSite: "none",
        secFetchMode: "navigate",
        secFetchUser: "?1",
        referer: null
      });
      expect(JSON.parse(output.stdout).userAgent).toContain("Chrome/136.0.0.0");
      expect(JSON.parse(output.stdout).accept).toContain("text/html");
      expect(JSON.parse(output.stdout).secChUa).toContain("Chromium");
      expect(output.stderr).toBe("");
    } finally {
      await rm(cookiesDir, { recursive: true, force: true });
    }
  });

  it("supports browser-profile overrides", async () => {
    const cookiesDir = await mkdtemp(path.join(tmpdir(), "cookieproxy-"));
    const cookieFile = path.join(cookiesDir, "other.test.json");

    try {
      await writeFile(cookieFile, JSON.stringify([
        {
          name: "session",
          value: "other",
          domain: "other.test",
          path: "/",
          secure: false,
          httpOnly: true,
          sameSite: "unspecified"
        }
      ]), "utf8");

      const output = await runCli([
        "src/cli/index.ts",
        "--cookies",
        cookiesDir,
        "--url",
        `${baseUrl}/headers`,
        "--referer",
        "https://example.com/source",
        "--accept-language",
        "en-GB,en;q=0.8",
        "--no-client-hints"
      ]);

      const headers = JSON.parse(output.stdout);
      expect(output.exitCode).toBe(0);
      expect(headers.referer).toBe("https://example.com/source");
      expect(headers.acceptLanguage).toBe("en-GB,en;q=0.8");
      expect(headers.secChUa).toBeNull();
      expect(headers.secFetchSite).toBe("cross-site");
      expect(output.stderr).toBe("");
    } finally {
      await rm(cookiesDir, { recursive: true, force: true });
    }
  });

  it("saves binary PDF responses exactly when output is provided", async () => {
    const cookiesDir = await mkdtemp(path.join(tmpdir(), "cookieproxy-"));
    const outputDir = await mkdtemp(path.join(tmpdir(), "cookieproxy-output-"));
    const cookieFile = path.join(cookiesDir, "127.0.0.1.json");
    const outputPath = path.join(outputDir, "article.pdf");

    await writeFile(cookieFile, JSON.stringify([
      {
        name: "session",
        value: "pdf",
        domain: "127.0.0.1",
        path: "/",
        secure: false,
        httpOnly: true,
        sameSite: "unspecified"
      }
    ]), "utf8");

    try {
      const output = await runCli([
        "src/cli/index.ts",
        "--cookies",
        cookiesDir,
        "--url",
        `${baseUrl}/pdf`,
        "--output",
        outputPath
      ]);

      expect(output.exitCode).toBe(0);
      expect(output.stdout).toBe("");
      expect(output.stderr).toBe("");
      expect(await readFile(outputPath)).toEqual(Buffer.from("%PDF-session=pdf", "utf8"));
    } finally {
      await rm(cookiesDir, { recursive: true, force: true });
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  it("reselects cookies when a redirect changes hosts for binary responses", async () => {
    const cookiesDir = await mkdtemp(path.join(tmpdir(), "cookieproxy-"));
    const outputDir = await mkdtemp(path.join(tmpdir(), "cookieproxy-output-"));
    const loopbackCookieFile = path.join(cookiesDir, "127.0.0.1.json");
    const localhostCookieFile = path.join(cookiesDir, "localhost.json");
    const outputPath = path.join(outputDir, "article.pdf");

    await writeFile(loopbackCookieFile, JSON.stringify([
      {
        name: "session",
        value: "loopback",
        domain: "127.0.0.1",
        path: "/",
        secure: false,
        httpOnly: true,
        sameSite: "unspecified"
      }
    ]), "utf8");

    await writeFile(localhostCookieFile, JSON.stringify([
      {
        name: "session",
        value: "localhost",
        domain: "localhost",
        path: "/",
        secure: false,
        httpOnly: true,
        sameSite: "unspecified"
      }
    ]), "utf8");

    try {
      const output = await runCli([
        "src/cli/index.ts",
        "--cookies",
        cookiesDir,
        "--url",
        `${baseUrl}/redirect-pdf-to-localhost`,
        "--output",
        outputPath
      ]);

      expect(output.exitCode).toBe(0);
      expect(output.stdout).toBe("");
      expect(output.stderr).toBe("");
      expect(await readFile(outputPath)).toEqual(Buffer.from("%PDF-session=localhost", "utf8"));
    } finally {
      await rm(cookiesDir, { recursive: true, force: true });
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  it("refuses to print binary responses to stdout without output", async () => {
    const cookiesDir = await mkdtemp(path.join(tmpdir(), "cookieproxy-"));
    const cookieFile = path.join(cookiesDir, "127.0.0.1.json");

    await writeFile(cookieFile, JSON.stringify([
      {
        name: "session",
        value: "pdf",
        domain: "127.0.0.1",
        path: "/",
        secure: false,
        httpOnly: true,
        sameSite: "unspecified"
      }
    ]), "utf8");

    try {
      const output = await runCli([
        "src/cli/index.ts",
        "--cookies",
        cookiesDir,
        "--url",
        `${baseUrl}/pdf`
      ]);

      expect(output.exitCode).toBe(1);
      expect(output.stdout).toBe("");
      expect(output.stderr).toContain("Refusing to write binary response to stdout");
      expect(output.stderr).toContain("Provide --output <file> to save it");
    } finally {
      await rm(cookiesDir, { recursive: true, force: true });
    }
  });
});

async function runCli(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--import", "tsx", ...args], {
      cwd: path.resolve(testDirectory, "../.."),
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolve({ stdout, stderr, exitCode });
    });
  });
}
