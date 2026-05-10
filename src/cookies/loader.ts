import path from "node:path";
import { CookieFileError } from "../core/errors.js";
import type { CookieFile, RawCookieRecord } from "../core/types.js";
import { listJsonFiles, readTextFile } from "../utils/fs.js";
import { domainHintFromFileName } from "../utils/url.js";

export async function loadCookieFiles(directoryPath: string): Promise<CookieFile[]> {
  const filePaths = await listJsonFiles(directoryPath);

  if (filePaths.length === 0) {
    throw new CookieFileError(`No JSON cookie files found in ${directoryPath}`);
  }

  return Promise.all(filePaths.map(async (filePath) => {
    const contents = await readTextFile(filePath);
    let parsed: unknown;

    try {
      parsed = JSON.parse(contents);
    } catch (error) {
      throw new CookieFileError(`Failed to parse JSON cookie file ${filePath}: ${formatError(error)}`);
    }

    if (!Array.isArray(parsed)) {
      throw new CookieFileError(`Cookie file ${filePath} must contain a JSON array`);
    }

    const cookies = parsed as RawCookieRecord[];
    const fileName = path.basename(filePath);

    return {
      filePath,
      fileName,
      domainHint: domainHintFromFileName(fileName),
      cookies
    };
  }));
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
