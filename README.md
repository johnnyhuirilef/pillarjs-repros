# pillarjs-repros

Minimal, self-contained reproductions for issues that I reported against the
[pillarjs](https://github.com/pillarjs) organization, which maintains packages
that Express uses, such as `router`, `send` and `finalhandler`.

Each directory is one reproduction: its own `package.json` with pinned
versions, and a README with the exact commands and the output to expect.
Each reproduction is plain JavaScript and runs with `npm install` and
`npm run repro`. The exit code is 1 when the bug is present and 0 when it is
fixed.

| Directory | Package | Issue or PR | What it shows |
|---|---|---|---|
