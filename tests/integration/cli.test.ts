import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
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
