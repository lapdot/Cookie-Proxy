import { parseArgs } from "./args.js";
import { CliUsageError } from "../core/errors.js";
import { createLogger } from "../utils/logger.js";
import { runCookieProxy } from "../services/cookieProxyService.js";
import { writeHtmlOutput } from "../fetch/responseWriter.js";

async function main(): Promise<void> {
  try {
    const options = parseArgs(process.argv.slice(2));
    const logger = createLogger(options.verbose || options.debugCookieMatch);
    const result = await runCookieProxy(options, logger);

    if (options.debugCookieMatch) {
      logger.error(`Selected cookie file: ${result.selectedCookieFile ?? "none"}`);
      for (const item of result.selectionExplanation) {
        logger.error(
          [
            `candidate=${item.fileName}`,
            `score=${item.score}`,
            `matchedCookies=${item.matchedCookieCount}`,
            `exactHint=${item.exactHostHintMatch}`,
            `suffixHint=${item.suffixHintMatch}`,
            `domains=${item.matchedDomains.join(",") || "-"}`,
            `rejected=${item.rejectedReasons.join(" | ") || "-"}`
          ].join(" ")
        );
      }
    }

    await writeHtmlOutput(result.html, options.outputPath, logger);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = error instanceof CliUsageError ? 1 : 2;
  }
}

void main();
