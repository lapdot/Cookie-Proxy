# CookieProxy

CookieProxy is a CLI-first TypeScript/Node.js tool that selects the correct cookie set for a target URL, performs an HTTP request with those cookies, and returns the resulting HTML.

## MVP Goals

- Accept a folder of cookie files
- Accept a target URL
- Choose the best cookie set for that URL
- Fetch the page with the selected cookies
- Output HTML to stdout or a file

## Cookie Input Assumptions

- Each cookie file is a JSON file
- File names follow a domain-based pattern such as `zhihu.com.json`, `foreignaffairs.com.json`, or `michaeljburry.substack.com.json`
- Each file contains a list of cookie objects
- Cookie objects include fields such as `domain`, `expirationDate`, and related browser-export-style attributes
- The default cookie directory is `/Users/lapdot/Documents/projects/workspace/configs/cookies`

CookieProxy is not limited to Zhihu. Any target URL is supported as long as you provide a matching cookie file for that host or one of its parent domains.

## Planned Documentation

- [MVP plan](./docs/mvp-plan.md)
- [Cookie policy notes](./docs/cookie-policy.md)

## Planned Stack

- TypeScript
- Node.js
- `tough-cookie`
- `undici`

## Status

Initial implementation is in progress:

- TypeScript CLI scaffold
- JSON cookie loading and normalization
- Cookie matching and selection
- HTML fetch pipeline with redirect handling
- First unit tests for policy and matching behavior
