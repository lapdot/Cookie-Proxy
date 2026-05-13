import type { Logger } from "../utils/logger.js";
import type { FetchResult } from "../core/types.js";
import { CliUsageError } from "../core/errors.js";
import { writeBinaryFile } from "../utils/fs.js";

export async function writeResponseOutput(
  result: FetchResult,
  outputPath: string | undefined,
  logger: Logger
): Promise<void> {
  if (outputPath) {
    await writeBinaryFile(outputPath, result.body);
    logger.info(`Wrote response output to ${outputPath}`);
    return;
  }

  if (!isTextLikeContentType(result.contentType)) {
    throw new CliUsageError(
      [
        `Refusing to write binary response to stdout (content-type=${result.contentType ?? "unknown"}).`,
        "Provide --output <file> to save it."
      ].join(" ")
    );
  }

  process.stdout.write(result.body.toString("utf8"));
}

export function isTextLikeContentType(contentType: string | null): boolean {
  if (!contentType) {
    return false;
  }

  const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase();
  if (!mediaType) {
    return false;
  }

  return mediaType.startsWith("text/") ||
    mediaType === "application/json" ||
    mediaType.endsWith("+json") ||
    mediaType === "application/xml" ||
    mediaType.endsWith("+xml");
}
