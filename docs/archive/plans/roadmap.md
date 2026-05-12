# CookieProxy Roadmap

> Archived document: this is a historical planning artifact.
> For active status and next steps, use [../../plans/current-plan.md](../../plans/current-plan.md).

## Current Status

CookieProxy has a working CLI MVP. The current implementation:

1. loads a directory of JSON cookie files
2. normalizes browser-export-style cookie records
3. selects one best cookie file for the current URL
4. loads the selected file into a per-hop `tough-cookie` jar
5. builds browser-like non-cookie request headers
6. performs HTTP requests with `undici`
7. manually follows redirects and reselects cookies for redirect targets
8. outputs HTML to stdout or a file

## Implemented Milestones

### Implemented: Project scaffold

- TypeScript CLI project structure
- test setup with `vitest`
- CLI entrypoint and service orchestration

### Implemented: Cookie file loading

- JSON cookie directory scanning
- JSON parsing for cookie files
- domain-oriented file-name hints

### Implemented: Cookie normalization

- normalized internal cookie model
- expiration parsing from `expirationDate`, `expires`, and `expiry`
- `sameSite` normalization:
  - `unspecified` -> `Lax`
  - `no_restriction` -> `None`
- host-only derivation from explicit flags or leading-dot domain absence

### Implemented: Cookie matching and selection

- candidate scoring using file-name hints plus cookie applicability
- domain, path, expiry, and secure filtering
- winning-file selection for the current URL
- debug explanation for match decisions

### Implemented: HTTP fetch pipeline

- `undici` request layer
- `tough-cookie` jar integration
- browser-like Chrome/macOS navigation request headers
- manual redirect handling
- cookie reselection on redirect targets
- timeout support
- HTML response output

### Implemented: CLI usability

- `--cookies`
- `--url`
- `--output`
- `--timeout`
- `--max-redirects`
- `--referer`
- `--accept-language`
- `--no-client-hints`
- `--verbose`
- `--debug-cookie-match`
- meaningful exit behavior for usage and runtime failures

### Implemented: Test coverage

- unit coverage for policy, matching, jar conversion, and request pipeline
- integration coverage against a local HTTP server
- redirect tests including host changes such as `127.0.0.1` to `localhost`

## Current Known Limitations

- Only JSON cookie files are supported
- Cookie files are not merged into one shared jar; one file wins per hop
- Response handling is HTML-only
- `Accept-Encoding` is intentionally not advertised right now, to avoid compressed binary-looking output
- No retry strategy beyond timeout failure
- No browser execution, DOM rendering, or API/server mode

## Next Milestones

### Next: Hardening and diagnostics

- improve malformed-cookie diagnostics
- document more cookie-file edge cases
- make timeout and redirect failures easier to interpret

### Next: Policy clarification

- define how tolerant parsing should be for partially invalid cookie records
- decide whether any nonstandard cookie-file repairs should be supported
- document any future deviations from baseline RFC 6265 behavior explicitly

### Next: Broader input support

- consider non-JSON cookie formats only after the JSON MVP is stable

## Definition Of Done For The Current MVP

The current MVP is considered complete because a user can:

```bash
cookieproxy \
  --cookies ./cookies \
  --url https://example.com \
  --output ./page.html
```

and the tool will:

- load JSON cookie files
- normalize cookie records
- select the best cookie file
- perform requests with `undici`
- apply cookies through `tough-cookie`
- follow redirects with cookie reselection
- write HTML output
