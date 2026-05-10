export function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^\.+/, "");
}

export function domainHintFromFileName(fileName: string): string {
  return normalizeHostname(fileName.replace(/\.json$/i, ""));
}

export function ensureUrl(input: string): URL {
  return new URL(input);
}
