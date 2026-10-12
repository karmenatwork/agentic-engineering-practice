# Contributing to Taskr API

## Setting up the development environment

Requirements: Node.js 18+ (needed for `node --watch` used by `npm run dev`). No external database — SQLite is created locally as a file.

```bash
git clone <repo-url>
cd agentic-engineering-practice
npm install
npm run db:seed    # creates the schema + sample data in taskr.db
npm test           # confirms the suite passes on a fresh checkout
npm run dev        # starts the server on port 3000 with file watching
```

Visit `http://localhost:3000/health` to confirm the server is running. If you need to start over with a clean database, run `npm run db:reset` (deletes `taskr.db` and re-seeds it).

Relevant environment variables (all optional, see `DB.js`, `auth.js`, `misc/constants.js`):

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `DB_PATH` | `taskr.db` | SQLite file location (ignored when `NODE_ENV=test`, which uses `:memory:`) |
| `API_KEY` | `dev-key` | Key checked against the `x-api-key` header on authenticated routes |

Before making changes, read [CLAUDE.md](CLAUDE.md) for the project's architecture and the structural patterns to avoid extending (`routes.js` growth, inline SQL in handlers, `utils.js` sprawl, `misc/` imports). If your change touches API routes, also read [.claude/context/api-conventions.md](.claude/context/api-conventions.md); if it touches tests, read [.claude/context/testing-standards.md](.claude/context/testing-standards.md).

## Commit message convention

Commit messages are a short, imperative summary of what changed, written as a sentence fragment (no trailing period), e.g.:

```
Move GET /tasks to a route/service/repository stack and add ?tag filter
Rename test files to the <resource>.test.js convention
Add JSDoc comments to existing modules
```

For routine maintenance (tooling, config, ignore rules) rather than application behavior, prefix with `chore:`:

```
chore: add verify-app command
chore: add to gitignore .claude/hooks.log
```

Keep each commit focused on one logical change.

## Running the test suite

```bash
npm test                                      # all Jest suites
npm run test:watch                            # watch mode
npx jest tests/tasks.test.js                  # a single file
npx jest tests/tasks.test.js -t "filters by"  # a single test by name
```

Test files must be named `<resource>.test.js` and live under `tests/` to be picked up by Jest's `testMatch` config in `package.json` — a file that doesn't match this pattern (or isn't added to `testMatch`) won't run, silently.

### What a passing run looks like

A clean run ends with every suite and test passing, no failures listed:

```
Test Suites: 7 passed, 7 total
Tests:       74 passed, 74 total
Snapshots:   0 total
Time:        0.6 s
Ran all test suites.
```

(Console output above the summary, like request logging from `middleware.js`, is expected noise — only the `Test Suites` / `Tests` summary line and the absence of any `FAIL` lines indicate a passing run.)

## The `/verify-app` command

Run `/verify-app` after any significant change, before committing. It runs the full suite serially (`npm test -- --runInBand`) and, if anything fails, fixes the implementation (never the test) and reruns until everything passes or the same failure persists after three attempts.

Use it any time you've touched route handlers, the schema, or shared helpers — not just when a test fails locally, since serial execution can surface ordering issues that a parallel run hides.

## Never commit with failing tests

Do not commit if any test is failing. A passing suite is the confirmation that the server and every API endpoint still work — treat a red test as a blocker, not something to fix in a follow-up commit.
