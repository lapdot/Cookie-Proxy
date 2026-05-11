# CookieProxy

CookieProxy is a CLI-first TypeScript/Node.js tool that selects the best cookie set for a target URL, performs an HTML request with those cookies, and returns the resulting HTML.

CookieProxy uses a browser-like Chrome/macOS navigation header profile by default while remaining an HTTP client, not a real browser. It does not execute JavaScript, render DOM content, or imitate browser TLS and low-level network fingerprints.

## What It Does

- Accept a folder of cookie files
- Accept a target URL
- Choose the best cookie set for that URL
- Fetch the page with the selected cookies and browser-like request headers
- Output HTML to stdout or a file

## Cookie Input Assumptions

- Each cookie file is a JSON file
- File names follow a domain-based pattern such as `zhihu.com.json`, `foreignaffairs.com.json`, or `michaeljburry.substack.com.json`
- Each file contains a list of cookie objects
- Cookie objects include fields such as `domain`, `expirationDate`, and related browser-export-style attributes
- The default cookie directory is `/Users/lapdot/Documents/projects/workspace/configs/cookies`

CookieProxy is not limited to Zhihu. Any target URL is supported as long as you provide a matching cookie file for that host or one of its parent domains.

## Request Behavior

- Sends a browser-like Chrome/macOS navigation header set by default
- Builds non-cookie headers separately from the outbound `Cookie` header
- Manually follows redirects and reselects the best cookie file for each hop
- Supports `--referer`, `--accept-language`, and `--no-client-hints`
- Intentionally does not send `Accept-Encoding` right now, to avoid compressed binary-looking output from raw HTTP responses

## Documentation

- [MVP plan](./docs/mvp-plan.md)
- [Usage](./docs/usage.md)
- [Cookie policy notes](./docs/cookie-policy.md)

## Stack

- TypeScript
- Node.js
- `tough-cookie`
- `undici`

## Status

Current implementation includes:

- JSON cookie loading and normalization
- Cookie matching and selection
- HTML fetch pipeline with manual redirect handling
- Browser-like request headers for top-level HTML navigation
- CLI controls for diagnostics and request-header overrides
- Unit and integration test coverage for cookie, redirect, and request behavior
