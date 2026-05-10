# CookieProxy MVP Specification

## Purpose

CookieProxy is a CLI tool that:

1. Reads a folder of JSON cookie files
2. Accepts a target URL
3. Selects the best cookie file for that URL
4. Fetches the page with the selected cookies
5. Outputs the returned HTML

The MVP is intentionally HTML-only. Browser rendering, DOM serialization, and browser automation are out of scope.

## Implemented Scope

### Inputs

- A directory containing JSON cookie files
- A target URL
- Optional CLI flags for timeout, redirects, output, and diagnostics

### Cookie file format

- Each cookie file is a JSON file
- File names follow a domain-oriented pattern such as:
  - `zhihu.com.json`
  - `foreignaffairs.com.json`
  - `michaeljburry.substack.com.json`
- Each file contains a list of browser-export-style cookie objects
- Cookie objects may include fields such as:
  - `name`
  - `value`
  - `domain`
  - `path`
  - `secure`
  - `httpOnly` or `http_only`
  - `hostOnly` or `host_only`
  - `expirationDate`, `expires`, or `expiry`
  - `sameSite`

### Outputs

- HTML content written to stdout or a file
- Optional diagnostics on stderr:
  - selected cookie file
  - cookie-match reasoning
  - redirect behavior
  - request/response progress

## Current Architecture

```text
CookieProxy/
  src/
    cli/
      index.ts
      args.ts
    core/
      types.ts
      errors.ts
    cookies/
      loader.ts
      normalizer.ts
      policy.ts
      matcher.ts
      jar.ts
    fetch/
      httpClient.ts
      requestPipeline.ts
      responseWriter.ts
    services/
      cookieProxyService.ts
    utils/
      url.ts
      fs.ts
      logger.ts
  tests/
    unit/
    integration/
  docs/
    mvp-plan.md
    roadmap.md
    cookie-policy.md
    usage.md
```

## Runtime Design

### Cookie ingestion and selection

- CookieProxy loads every JSON cookie file in the configured directory.
- Cookie records are normalized into one internal structure before matching.
- File names are used as selection hints, but selection is validated against cookie-level applicability.
- For each request URL, CookieProxy chooses one winning cookie file.

### Fetch pipeline

- CookieProxy recomputes the best cookie file for the current request URL.
- The selected file's cookies are loaded into a fresh `tough-cookie` jar for that hop.
- `tough-cookie` determines which cookies apply to the URL and serializes the outbound `Cookie` header.
- `undici` performs the HTTP request.
- Redirects are handled manually.
- On each redirect target, CookieProxy reruns cookie-file selection and rebuilds the jar for the redirected URL.

### Logging and diagnostics

- Logging is implemented with `pino`.
- CLI output remains human-readable plain text on stderr.
- `--verbose` enables progress logging and debug-level request diagnostics.
- `--debug-cookie-match` prints the winning cookie file and scoring explanation for all candidates.

## CLI Interface

```bash
cookieproxy \
  --cookies ./cookies \
  --url https://example.com/account \
  --output ./page.html
```

### Supported flags

- `--cookies <dir>`: directory containing JSON cookie files
- `--url <url>`: target URL to request
- `--output <file>`: write HTML to a file instead of stdout
- `--timeout <ms>`: request timeout in milliseconds, default `30000`
- `--max-redirects <n>`: maximum redirect hops, default `5`
- `--verbose`: print progress and debug diagnostics to stderr
- `--debug-cookie-match`: print cookie selection reasoning to stderr

## Current Stack

- `typescript`
- `tsx`
- `undici`
- `tough-cookie`
- `pino`
- `vitest`
- `@types/node`

## Testing Coverage

### Unit tests

- cookie normalization
- `sameSite` normalization
- domain, path, expiry, and secure matching
- cookie-file selection scoring
- cookie-to-jar conversion
- request-pipeline redirect reselection

### Integration tests

- local HTTP server requests
- redirect handling
- host changes across redirects
- end-to-end CLI runs producing HTML output

## MVP Definition

The MVP is complete when a user can run a command like:

```bash
cookieproxy \
  --cookies ./cookies \
  --url https://example.com \
  --output ./page.html
```

and the tool:

- loads JSON cookie files
- normalizes cookie records
- selects one best cookie file per request hop
- fetches the page with `undici`
- applies per-request cookies through `tough-cookie`
- follows redirects with reselection
- writes returned HTML

## Known Limitations

- Only JSON cookie files are supported
- Only one cookie file is selected per hop; files are not merged into one global jar
- HTML is fetched as a plain HTTP response; no browser execution is performed
- Retry strategy and malformed-cookie tolerance are still minimal
