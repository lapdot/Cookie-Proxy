export interface Logger {
  info(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}

export function createLogger(verbose: boolean): Logger {
  return {
    info(message: string) {
      if (verbose) {
        process.stderr.write(`${message}\n`);
      }
    },
    error(message: string) {
      process.stderr.write(`${message}\n`);
    },
    debug(message: string) {
      if (verbose) {
        process.stderr.write(`[debug] ${message}\n`);
      }
    }
  };
}
