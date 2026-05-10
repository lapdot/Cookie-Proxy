import { Writable } from "node:stream";
import pino from "pino";

export interface Logger {
  info(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}

export function createLogger(verbose: boolean): Logger {
  const logger = pino(
    {
      level: verbose ? "debug" : "error",
      base: undefined,
      timestamp: false,
      messageKey: "message"
    },
    new PlainTextPinoStream()
  );

  return {
    info(message: string) {
      logger.info(message);
    },
    error(message: string) {
      logger.error(message);
    },
    debug(message: string) {
      logger.debug(message);
    }
  };
}

class PlainTextPinoStream extends Writable {
  override _write(chunk: Buffer | string, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    try {
      const payload = JSON.parse(String(chunk)) as { level?: number; message?: string };
      const message = payload.message ?? "";
      const prefix = payload.level === 20 ? "[debug] " : "";
      process.stderr.write(`${prefix}${message}\n`);
      callback();
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
