# CookieProxy MVP Plan

## Purpose

CookieProxy is a CLI tool that:

1. Reads a folder of cookie files
2. Accepts a target URL
3. Selects the most appropriate cookie set for that URL
4. Fetches the page using the selected cookies
5. Outputs the returned HTML

The MVP is intentionally HTML-only. DOM rendering and browser automation are out of scope for now.

## Product Scope

### Inputs

- A directory containing cookie files
- A target URL
- Optional CLI flags for output behavior and diagnostics

### Cookie file format

- Each cookie file is a JSON file
- File names follow a domain-based naming pattern, for example:
  - `zhihu.com.json`
  - `foreignaffairs.com.json`
  - `michaeljburry.substack.com.json`
- Each JSON file contains a list of dictionaries / objects
- Each object represents one cookie, for example:

```json
{
  "domain": ".substack.com",
  "expirationDate": 1812267128.541113
}
```

- The full object may include additional browser-export-style fields beyond `domain` and `expirationDate`

### Outputs

- HTML content for the requested page
- Optional debug metadata:
  - selected cookie file
  - matched cookies
  - final URL after redirects
  - HTTP status
  - cookie-selection reasoning

## MVP Architecture

```text
CookieProxy/
  src/
    cli/
      index.ts
      args.ts
    core/
      types.ts
      config.ts
      errors.ts
    cookies/
      loader.ts
      parser.ts
      normalizer.ts
      policy.ts
      matcher.ts
      scorer.ts
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
    cookie-policy.md
```

## Module Responsibilities

### CLI

- Parse arguments
- Validate user input
- Print HTML or write it to a file
- Expose verbose and debug modes

### Cookie ingestion

- Scan the cookie directory
- Parse JSON cookie files
- Normalize all cookies into one internal structure
- Use file names as a first-pass hint for candidate selection, while still validating against actual cookie domains

### Cookie policy

- Implement matching behavior based on RFC 6265
- Centralize project-specific deviations from the RFC
- Keep this behavior explicit and testable

### Cookie selection

- Determine which cookie file or cookie set applies to a URL
- Rank competing candidates by specificity and usability
- Prefer cookie files whose domain-oriented file name is a close match for the target host, then validate with cookie-level matching rules

### Fetch pipeline

- Build a request using `undici`
- Apply the selected cookies to the request
- Follow redirects according to configured behavior
- Return HTML and response metadata

## Recommended CLI Shape

```bash
cookieproxy \
  --cookies ./cookies \
  --url https://example.com/account \
  --output ./page.html
```

### Useful flags

- `--cookies <dir>`
- `--url <url>`
- `--output <file>`
- `--format <auto|netscape|json>`
- `--timeout <ms>`
- `--max-redirects <n>`
- `--verbose`
- `--debug-cookie-match`

## Third-Party Libraries

### Recommended core set

- `typescript`
- `tsx`
- `tough-cookie`
- `undici`
- `commander` or `yargs`
- `zod`
- `fast-glob`
- `pino`
- `vitest`
- `@types/node`

### Why these libraries

- `tough-cookie`: cookie parsing, storage, and matching foundation
- `undici`: HTTP client and modern Node HTTP primitives
- `commander` or `yargs`: CLI argument parsing
- `zod`: runtime validation for CLI and config input
- `fast-glob`: efficient cookie file discovery
- `pino`: structured logs for debug and diagnostics
- `vitest`: unit and integration testing

### Not needed for the MVP

- `playwright`
- `axios`
- `jsdom`

## Phased Delivery

## Phase 1: CLI MVP

- Set up TypeScript project structure
- Implement CLI argument parsing
- Load cookie files from a directory
- Support JSON cookie files as the initial and required MVP format
- Normalize cookies into one internal model
- Select the best cookie set for a target URL
- Fetch HTML with `undici`
- Print or save the result

## Phase 2: Cookie policy hardening

- Encode the customized RFC-6265-based rules in `cookies/policy.ts`
- Add tests for edge cases and deviations
- Improve diagnostics around cookie matching and rejection

## Phase 3: Robustness

- Better redirect handling
- Timeout and retry strategy
- Malformed-cookie tolerance
- Clearer error messages and debug output

## Testing Strategy

### Unit tests

- cookie parsing
- normalization
- domain matching
- path matching
- expiry handling
- secure-cookie behavior
- `sameSite` normalization:
  - `unspecified` -> `Lax`
  - `no_restriction` -> `None`
- selection scoring
- custom policy behavior

### Integration tests

- fixture-based cookie directories
- local HTTP test server
- end-to-end CLI runs producing HTML output

### Golden fixtures

- overlapping domains
- expired cookies
- secure-only cookies
- malformed input
- JSON files with browser-export-style cookie fields
- `sameSite` values of `unspecified` and `no_restriction`
- redirect scenarios

## Key Risks

- Cookie files may come in inconsistent formats
- Nonstandard policy changes may become hard to reason about if not centralized
- Redirect flows may change which cookies should apply
- Some sites may rely on behavior outside a simple HTTP request flow

## Recommended First Milestone

Build a thin but complete CLI that:

1. reads a cookie folder
2. accepts a URL
3. selects the best cookie set
4. performs a request with `undici`
5. outputs HTML
6. explains cookie-selection decisions in debug mode

## Settled MVP Decisions

- The MVP input format is JSON cookie files
- File names follow a domain-based pattern such as `zhihu.com.json`, `foreignaffairs.com.json`, or `michaeljburry.substack.com.json`
- Each file contains a list of cookie objects
- Output is HTML only
- The project is CLI-first

## Open Questions

- Should the default output go to stdout, a file, or support both equally?
- Should redirects reuse the same resolved jar or re-evaluate cookies per destination URL?
