# CookieProxy Current Plan

This is the active planning and status document for CookieProxy.

Historical planning artifacts live under [docs/archive/plans/](../archive/plans/).

CookieProxy's planning-location convention is defined in [../policies/documentation-structure.md](../policies/documentation-structure.md).

## Current Status

CookieProxy has a working CLI MVP that:

- loads a directory of JSON cookie files
- normalizes browser-export-style cookie records
- skips browser-export cookie records whose `name` is a blank string while preserving strict validation for missing or non-string names
- selects one winning cookie file per request URL
- builds browser-like non-cookie headers
- performs HTTP requests with `undici`
- manually follows redirects and reselects cookies per hop
- writes text-like responses to stdout and saves response bodies to files with binary-safe output
- documents binary output, `Accept-Encoding`, and ignored in-repo artifact retrieval conventions

## Canonical Docs

- Runtime behavior: [../policies/cookie-policy.md](../policies/cookie-policy.md)
- CLI usage: [../reference/cli-usage.md](../reference/cli-usage.md)
- Documentation structure: [../policies/documentation-structure.md](../policies/documentation-structure.md)

## Current Priorities

### Hardening and diagnostics

- improve malformed-cookie diagnostics
- make timeout and redirect failures easier to interpret
- document more cookie-file edge cases when they become implementation-relevant

### Policy clarification

- decide whether additional partially invalid cookie-record cases should be skipped or remain hard failures
- decide whether any nonstandard cookie-file repair behavior should be supported beyond in-memory tolerance rules
- document any deliberate deviation from baseline RFC 6265 behavior explicitly

### Broader input support

- consider non-JSON cookie formats only after the current JSON-based workflow is stable

## Validation Baseline

Changes that affect behavior should continue to preserve:

- unit coverage for cookie policy, matching, jar conversion, and request pipeline behavior
- integration coverage for CLI execution and redirect flows
- alignment between CLI behavior and the canonical policy/reference docs
