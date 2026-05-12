# CookieProxy Context

`CONTEXT.md` is the agent-first repository entrypoint for CookieProxy.

Start here after `AGENTS.md` to get the current repository map, canonical commands, and source-of-truth docs.

## Repository Purpose

CookieProxy is a CLI-first TypeScript/Node.js tool that selects the best cookie set for a target URL, sends an HTTP request with browser-like headers, and returns the resulting HTML.

It is an HTTP client, not a browser: it does not execute JavaScript, render a DOM, or emulate browser TLS and low-level network fingerprints.

## Primary Surfaces

- `src/cli/`: CLI entrypoint and argument parsing
- `src/cookies/`: cookie loading, normalization, policy, matching, and jar conversion
- `src/fetch/`: browser-profile headers, HTTP transport, redirect pipeline, and response writing
- `src/services/`: service orchestration
- `src/core/`: shared types and errors
- `tests/unit/`: unit coverage for cookie, matching, jar, and request behavior
- `tests/integration/`: CLI integration coverage

## Canonical Commands

- `npm test`: run the test suite
- `npm run build`: compile the TypeScript project
- `npm run dev -- --url <url>`: run the CLI from source with `tsx`
- `npm run package:sea`: build the single-executable application artifact

## Reading Order

1. [README.md](./README.md) for the human-first project overview and quick usage
2. [docs/policies/cookie-policy.md](./docs/policies/cookie-policy.md) for runtime cookie behavior
3. [docs/reference/cli-usage.md](./docs/reference/cli-usage.md) for flags, defaults, and troubleshooting
4. [docs/plans/current-plan.md](./docs/plans/current-plan.md) for current planning/status
5. [docs/README.md](./docs/README.md) for the full docs-tree index

## Source Of Truth

- Runtime cookie behavior: [docs/policies/cookie-policy.md](./docs/policies/cookie-policy.md)
- Documentation structure rules: [docs/policies/documentation-structure.md](./docs/policies/documentation-structure.md)
- CLI usage and troubleshooting: [docs/reference/cli-usage.md](./docs/reference/cli-usage.md)
- Active planning/status: [docs/plans/current-plan.md](./docs/plans/current-plan.md)

## Repository-Specific Operating Notes

- Keep docs links aligned when moving or renaming Markdown files.
- Treat the most specific documented contract as authoritative when docs differ.
- Update tests and docs together when behavior or interfaces change.
- Consult the documentation structure policy for the repo's planning convention, and use [docs/plans/current-plan.md](./docs/plans/current-plan.md) as the current active tracked plan.
