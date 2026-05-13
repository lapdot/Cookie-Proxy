# CookieProxy

CookieProxy is a CLI-first TypeScript/Node.js tool that selects the best cookie set for a target URL, performs an HTTP request with those cookies, and returns the response body.

CookieProxy uses a browser-like Chrome/macOS navigation header profile by default while remaining an HTTP client, not a real browser. It does not execute JavaScript, render DOM content, or imitate browser TLS and low-level network fingerprints.

## What It Does

- Accept a folder of cookie files
- Accept a target URL
- Choose the best cookie set for that URL
- Fetch the page or file with the selected cookies and browser-like request headers
- Output text-like responses to stdout or save any response body to a file

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
- Intentionally does not send `Accept-Encoding` right now, which keeps response handling simple

## Quick Usage

```bash
cookieproxy \
  --cookies ./cookies \
  --url https://example.com/account \
  --output ./page.html
```

If `--output` is omitted, text-like responses are written to stdout. Binary responses such as PDFs require `--output`.

For repeatable saved retrievals, use the ignored in-repo `artifacts/` folder with timestamped names. See [CLI usage](./docs/reference/cli-usage.md) for the artifact naming convention and binary-output notes.

## Development Setup

```bash
npm install
npm run hooks:install
npm test
```

`npm run hooks:install` configures Git to use the repo-managed `.githooks/` directory. The pre-commit hook runs `npm test`; failing tests block the commit. Use Git's standard `--no-verify` escape hatch only when intentionally bypassing local validation.

## Documentation

- [Docs index](./docs/README.md)
- [CLI usage](./docs/reference/cli-usage.md)
- [Cookie policy](./docs/policies/cookie-policy.md)
- [Current plan](./docs/plans/current-plan.md)

## Stack

- TypeScript
- Node.js
- `tough-cookie`
- `undici`

## Status

Current implementation includes:

- JSON cookie loading and normalization
- Cookie matching and selection
- Response fetch pipeline with manual redirect handling
- Binary-safe file output for responses such as PDFs
- Browser-like request headers for top-level HTML navigation
- CLI controls for diagnostics and request-header overrides
- Unit and integration test coverage for cookie, redirect, and request behavior

## Repository Entrypoints

- `README.md`: human-first overview and quick usage
- `CONTEXT.md`: agent-first repository entrypoint
- `docs/README.md`: docs-tree index
