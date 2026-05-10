import type { Logger } from "../utils/logger.js";
import { writeTextFile } from "../utils/fs.js";

export async function writeHtmlOutput(
  html: string,
  outputPath: string | undefined,
  logger: Logger
): Promise<void> {
  if (outputPath) {
    await writeTextFile(outputPath, html);
    logger.info(`Wrote HTML output to ${outputPath}`);
    return;
  }

  process.stdout.write(html);
}
