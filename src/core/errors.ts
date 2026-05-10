export class CookieProxyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CookieProxyError";
  }
}

export class CliUsageError extends CookieProxyError {
  constructor(message: string) {
    super(message);
    this.name = "CliUsageError";
  }
}

export class CookieFileError extends CookieProxyError {
  constructor(message: string) {
    super(message);
    this.name = "CookieFileError";
  }
}

export class CookieNormalizationError extends CookieProxyError {
  constructor(message: string) {
    super(message);
    this.name = "CookieNormalizationError";
  }
}
