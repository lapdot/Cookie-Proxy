# CookieProxy Cookie Policy

## Purpose

CookieProxy uses a hybrid cookie model:

- CookieProxy owns cookie-file loading, normalization, and winning-file selection
- CookieProxy owns browser-like non-cookie header construction
- `tough-cookie` owns per-request cookie applicability and outbound cookie-header serialization
- `undici` owns HTTP transport

This document is the source of truth for implemented cookie behavior in the current CLI.

## Input Cookie Format

- Each cookie file is a JSON file
- The file name is a domain-oriented hint such as `zhihu.com.json` or `michaeljburry.substack.com.json`
- Each file contains a list of browser-export-style cookie objects

### Required fields

- `name`
- `domain`

### Optional or defaulted fields

- `value`: defaults to `""`
- `path`: defaults to `/`
- `secure`: defaults to `false`
- `httpOnly` or `http_only`: defaults to `false`
- `hostOnly` or `host_only`: inferred if missing
- `sameSite`: normalized if present
- `expirationDate`, `expires`, or `expiry`: parsed if present

## Normalization Rules

### Host and domain

- Cookie domains are normalized to lowercase hostnames without a leading dot.
- `hostOnly` is `true` if:
  - `hostOnly` or `host_only` is explicitly `true`, or
  - the original domain does not start with `.`
- Otherwise the cookie is treated as a domain cookie.

### Expiry fields

- CookieProxy accepts expiry values from:
  - `expirationDate`
  - `expires`
  - `expiry`
- Numeric values are interpreted as:
  - milliseconds if they are already large timestamp values
  - seconds if they look like Unix-second values
- Non-empty string values are interpreted as:
  - numeric timestamps when possible
  - otherwise `Date.parse(...)`

### SameSite mapping

- missing or unknown `sameSite` values normalize to `Lax`
- `unspecified` normalizes to `Lax`
- `no_restriction` normalizes to `None`
- `none` normalizes to `None`
- `strict` normalizes to `Strict`

## Selection Model

- CookieProxy does not merge all cookie files into one global jar.
- For each request URL, CookieProxy selects one winning cookie file.
- Selection uses:
  - domain-oriented file-name hints
  - cookie applicability according to CookieProxy's matching rules
  - scoring that prefers more specific hosts and useful paths

The result is an effective request model of one selected cookie file per hop.

## Request-Time Cookie Behavior

### CookieProxy responsibilities

- load cookie files
- normalize cookie records
- score candidate files
- choose the winning file for the current URL
- build browser-like non-cookie request headers for the current URL
- recompute selection after redirects

### Tough-cookie responsibilities

- populate a fresh per-request jar from the selected file
- determine which cookies apply to the current URL
- enforce domain, path, secure, host-only, and expiry behavior
- serialize the outbound `Cookie` header

### Undici responsibilities

- execute the HTTP request
- return status, headers, and body data to the request pipeline

## Request Header Model

- CookieProxy builds browser-like non-cookie headers separately from the outbound `Cookie` header.
- The default request profile imitates a Chrome/macOS top-level HTML navigation.
- Client hint headers (`sec-ch-ua`, `sec-ch-ua-mobile`, `sec-ch-ua-platform`) are enabled by default.
- `--no-client-hints` disables those client hint headers.
- `--accept-language` overrides the default `Accept-Language` value.
- `--referer` adds an explicit `Referer` header for the request chain.
- `Accept-Encoding` is intentionally not sent right now, to avoid compressed response bodies surfacing as binary-looking output from the raw HTTP client.

## Redirect Rule

- Redirects are handled manually by CookieProxy.
- For each redirect target:
  - the redirect URL is resolved
  - browser-like non-cookie headers are rebuilt for the new URL
  - cookie-file selection is rerun for the new URL
  - a new `tough-cookie` jar is built from the newly selected file
  - the next request is issued with that jar

This means a redirect can legitimately switch the selected cookie file, including local cases such as `127.0.0.1` redirecting to `localhost`.

If an explicit `--referer` value is provided, that `Referer` header is preserved across redirect hops even while cookies are reselected per hop.

## Local Development Compatibility

- The per-request `tough-cookie` jar disables public-suffix rejection.
- This is intentional so local hosts such as `localhost` work during testing and redirect flows.
- This setting is scoped to the in-memory jar created for each request hop.

## Current Open Policy Questions

- Should partially invalid cookie records fail the entire run or be skipped more selectively?
- Which malformed browser-export quirks should be tolerated automatically?
- Should CookieProxy eventually support any cookie-file repair behavior, or stay strict and explicit?
