# CookieProxy Usage

## Basic Command

```bash
cookieproxy \
  --cookies ./cookies \
  --url https://example.com/account \
  --output ./page.html
```

If `--output` is omitted, HTML is written to stdout.

## Flags

- `--cookies <dir>`: directory containing JSON cookie files
- `--url <url>`: target URL to request
- `--output <file>`: write HTML to a file instead of stdout
- `--timeout <ms>`: request timeout in milliseconds, default `30000`
- `--max-redirects <n>`: maximum redirect hops, default `5`
- `--verbose`: print progress and request diagnostics to stderr
- `--debug-cookie-match`: print cookie selection reasoning to stderr

## Defaults

- Default cookies directory:
  `/Users/lapdot/Documents/projects/workspace/configs/cookies`
- Default timeout: `30000`
- Default max redirects: `5`

## Output Behavior

- HTML response content goes to stdout unless `--output` is used
- Diagnostic and debug messages go to stderr
- Logging is powered by `pino` internally, but the CLI prints human-readable plain text

## Redirect Behavior

- CookieProxy selects one best cookie file for the current URL
- The selected file is loaded into a fresh `tough-cookie` jar for that request
- Redirects are followed manually
- On each redirect target, CookieProxy reruns cookie-file selection and rebuilds the jar

This means different hops in the same request chain can use different cookie files.

## Diagnostics

### `--verbose`

Prints progress and request-level diagnostics such as:

- cookie directory loading
- number of cookie files loaded
- target URL being fetched
- request preparation
- response status and redirect flow

### `--debug-cookie-match`

Prints cookie-selection reasoning such as:

- selected cookie file
- candidate scores
- matched cookie counts
- exact-host and suffix-host matches
- rejected reasons

## Troubleshooting

### No matching cookie file

- Check that the cookie file name resembles the target host
- Check that cookie `domain`, `path`, `secure`, and expiry values make the file usable for the URL

### Redirect loop or max redirects exceeded

- Increase `--max-redirects` if the site legitimately redirects several times
- Inspect stderr with `--verbose` to see which URLs are being followed

### Malformed cookie JSON

- Confirm the file is valid JSON
- Confirm required fields such as `name` and `domain` are present
- Check expiry values in `expirationDate`, `expires`, or `expiry`

### `127.0.0.1` versus `localhost`

- CookieProxy reselects cookies on redirect targets
- A request that starts on `127.0.0.1` and redirects to `localhost` may switch to a different cookie file
- Provide separate cookie files when both hosts matter
