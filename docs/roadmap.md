# CookieProxy Roadmap

## Purpose

This roadmap turns the MVP plan into a practical execution sequence for the first implementation passes.

The current goal is a CLI-first HTML-only tool that:

1. reads a directory of JSON cookie files
2. selects the correct cookie set for a target URL
3. applies CookieProxy's RFC-6265-based cookie policy
4. fetches the target page with `undici`
5. outputs HTML

## Milestone 0: Project Scaffold

### Goal

Create the initial TypeScript CLI project structure and establish development conventions.

### Deliverables

- `package.json`
- `tsconfig.json`
- `src/` directory structure
- `tests/` directory structure
- initial CLI entrypoint
- formatter and test scripts

### Exit criteria

- the project installs and runs locally
- a placeholder CLI command executes successfully

## Milestone 1: Cookie File Loading

### Goal

Load JSON cookie files from a directory and parse them safely.

### Deliverables

- cookie directory scanner
- JSON parser for cookie files
- input validation for file shape
- structured error reporting for malformed files

### Notes

- file names follow domain-based patterns such as `zhihu.com.json`, `substack.com.json`, or `michaeljburry.substack.com.json`
- each file contains a list of cookie objects
- file names should be treated as selection hints, not as the sole source of truth

### Exit criteria

- the CLI can enumerate cookie files
- valid JSON cookie files are loaded into memory
- invalid files produce clear diagnostics

## Milestone 2: Cookie Normalization

### Goal

Map input cookie objects into one internal model that the rest of the system can use consistently.

### Deliverables

- normalized internal cookie type
- field-mapping layer from JSON input to internal cookie objects
- conversion for expiration fields
- `sameSite` normalization rules

### Confirmed policy mappings

- `sameSite: "unspecified"` -> `Lax`
- `sameSite: "no_restriction"` -> `None`

### Exit criteria

- all loaded cookies can be normalized or rejected with explicit reasons
- normalization behavior is covered by unit tests

## Milestone 3: Cookie Matching And Selection

### Goal

Choose the best cookie file for a target URL.

### Deliverables

- candidate selection from file names and domains
- cookie-level domain and path matching
- expiry filtering
- secure-cookie handling
- scoring logic for competing cookie files
- debug explanation for why a file won

### Exit criteria

- the tool can select one best cookie set for representative test URLs
- debug mode explains the match decision clearly

## Milestone 4: HTTP Fetch Pipeline

### Goal

Fetch the requested page with the selected cookies and return HTML.

### Deliverables

- `undici` request layer
- `tough-cookie` jar integration
- redirect handling
- timeout handling
- HTML response output

### Exit criteria

- the tool performs a request with the selected cookies
- redirects are handled predictably
- HTML is written to stdout or a file

## Milestone 5: CLI Usability

### Goal

Make the tool pleasant and predictable to use from the command line.

### Deliverables

- polished argument parsing
- help text
- verbose mode
- debug-cookie-match mode
- output-file support
- meaningful exit codes

### Exit criteria

- the CLI is usable without reading implementation details
- common failure paths have clear messages

## Milestone 6: Testing And Hardening

### Goal

Cover the risky parts before expanding scope.

### Deliverables

- unit tests for parsing and normalization
- unit tests for `sameSite` policy behavior
- unit tests for domain/path matching
- integration tests with fixture cookie folders
- integration tests against a local HTTP server

### Exit criteria

- core logic has automated coverage
- representative edge cases are captured by fixtures

## Recommended Build Order

1. scaffold project structure
2. implement cookie file loading
3. implement normalization
4. implement matching and scoring
5. implement HTTP fetch flow
6. polish CLI behavior
7. add test coverage and hardening

## MVP Definition Of Done

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
- applies the current cookie policy
- selects the best cookie file for the URL
- fetches the page with `undici`
- writes the returned HTML

## Deferred Until After MVP

- browser rendering
- DOM serialization
- non-JSON cookie formats
- API/server mode
- advanced caching
- distributed or scheduled execution
