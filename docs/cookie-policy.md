# CookieProxy Cookie Policy

## Purpose

CookieProxy will use `tough-cookie` as its core cookie engine, with behavior based on RFC 6265 plus a small set of project-specific adjustments.

This document is the place to define those adjustments clearly before or during implementation.

## Baseline Behavior

The default policy should follow the usual RFC 6265 concepts:

- domain matching
- path matching
- host-only vs domain cookies
- expiry and max-age handling
- secure-cookie behavior
- cookie ordering and applicability to a request URL

## Input Cookie Format

- Each cookie file is a JSON file
- The file name follows a domain-oriented pattern such as `zhihu.com.json`, `foreignaffairs.com.json`, or `michaeljburry.substack.com.json`
- Each file contains a list of cookie objects
- Cookie objects use browser-export-style fields, for example:

```json
{
  "domain": ".substack.com",
  "expirationDate": 1812267128.541113
}
```

- Additional fields are expected and should be mapped into the internal cookie model during normalization

## Confirmed RFC 6265 Adjustment

The currently confirmed project-specific change is in `sameSite` handling:

- `unspecified` should be treated as `Lax`
- `no_restriction` should be treated as `None`

This mapping should happen during cookie normalization so later matching logic can operate on one consistent representation.

## Project-Specific Policy Layer

Any deviation from standard RFC 6265 behavior should live in one explicit policy module, currently planned as:

`src/cookies/policy.ts`

That module should be responsible for:

- documenting accepted deviations
- isolating custom matching logic
- making edge cases easy to test
- preventing policy changes from being scattered across the codebase

## Planned Questions To Resolve

- Which nonstandard cookie-file quirks should be tolerated during parsing?
- Should invalid or partially invalid cookie records be skipped, repaired, or fail the run?
- If multiple cookie files match a URL, what exact precedence rules should decide the winner?
- During redirects, should cookie applicability be recalculated against the redirected URL each time?

## Suggested Principle

Prefer predictable and testable behavior over permissive but opaque behavior. If we bend the standard, we should do it deliberately and document the reason here.

## Next Step

As implementation starts, this file should be updated with:

- the exact field mapping from input JSON to the internal cookie model
- the actual project-specific RFC 6265 deviations
- concrete examples of matching and rejection behavior
