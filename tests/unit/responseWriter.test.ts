import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { writeResponseOutput } from "../../src/fetch/responseWriter.js";
import { createLogger } from "../../src/utils/logger.js";
import { CliUsageError } from "../../src/core/errors.js";
import type { FetchResult } from "../../src/core/types.js";

function createResult(body: Buffer, contentType: string | null): FetchResult {
  return {
    body,
    contentType,
    finalUrl: "https://example.com/resource",
    status: 200,
    selectedCookieFile: null,
    steps: [],
    selectionExplanation: []
  };
}

describe("writeResponseOutput", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes response bytes exactly when output path is provided", async () => {
    const outputDir = await mkdtemp(path.join(tmpdir(), "cookieproxy-output-"));
    const outputPath = path.join(outputDir, "article.pdf");
    const pdfBytes = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x00, 0xff]);

    try {
      await writeResponseOutput(
        createResult(pdfBytes, "application/pdf"),
        outputPath,
        createLogger(false)
      );

      expect(await readFile(outputPath)).toEqual(pdfBytes);
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  it("prints text-like responses to stdout when no output path is provided", async () => {
    const stdoutWrite = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await writeResponseOutput(
      createResult(Buffer.from("<html>ok</html>", "utf8"), "text/html; charset=utf-8"),
      undefined,
      createLogger(false)
    );

    expect(stdoutWrite).toHaveBeenCalledWith("<html>ok</html>");
  });

  it("refuses to print binary responses to stdout", async () => {
    await expect(
      writeResponseOutput(
        createResult(Buffer.from("%PDF-", "utf8"), "application/pdf"),
        undefined,
        createLogger(false)
      )
    ).rejects.toThrow(CliUsageError);
  });
});
