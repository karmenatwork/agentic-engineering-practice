# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Taskr API — a REST API for task management (users, projects, tasks, comments, tags). Node.js (CommonJS) · Express 5 · SQLite via `better-sqlite3` (synchronous API) · Jest + supertest. There is no build step and no linter configured.

This codebase has **intentional structural problems** that will be addressed in a future refactor: a monolithic `routes.js`, DB queries inline in route handlers, no service/repository layer, inconsistent file naming (`DB.js`, `get-tasks.js`, `UserController.js`), misplaced helpers, duplicated schema, a circular dependency, and dead code. Many files carry comments/TODOs describing their own problems (e.g. "belongs in a repository layer") — these are known refactoring targets, not work already done.

Understand the current state, but do not reinforce the bad patterns. When adding or changing code, don't copy the existing structure just because it's there: don't add more inline SQL to route handlers, don't grow `routes.js` further when a new module fits better, don't add to the circular dependency, and don't build on the dead code in `misc/`. Keep changes consistent with the direction of the planned refactor, and flag it when a requested change would otherwise require extending a known-bad pattern.

## Never do these

- **Never add new route logic to `routes.js`.** It is already too large; new routes belong in a dedicated route file for their resource.
- **Never add new utility functions to `utils.js`** without first checking whether they belong in a more specific module.
- **Never add new imports from the `misc/` directory.** It is scheduled for removal. The one exception already in use is `misc/constants.js` (`PORT`, `VALID_TASK_STATUSES`, imported by `index.js` and `routes.js`). That file is live, so don't delete it or break those imports. If new code needs one of those constants, move the constant to a proper module rather than adding another `misc/` import.

## Context files

Read the matching file before starting these tasks:

- `.claude/context/api-conventions.md`: any task involving API routes or endpoints.
- `.claude/context/testing-standards.md`: any task involving tests or test coverage.

## Memory

When asked to remember something, store it in the ogham MCP (`store_memory`) with a `project:agentic-engineering-practice` tag.

## Commands

```bash
npm install
npm run db:seed          # create schema + sample data in taskr.db (skips if users already exist)
npm run db:reset         # delete taskr.db and re-seed
npm run dev              # start with node --watch on port 3000 (PORT env overrides)
npm start
npm test                 # all Jest suites
npm run test:watch
npx jest tests/tasks.test.js            # single file
npx jest tests/tasks.test.js -t "filters by"   # single test by name
```

Health check: `GET http://localhost:3000/health`.

## Architecture

- `index.js` builds the Express app, mounts `routes.js`, and only calls `listen` when run directly (`require.main === module`); tests import the app from it. A couple of routes (`/`, `POST /webhooks/task-update`) are defined inline in `index.js` rather than in `routes.js`.
- `routes.js` holds nearly every endpoint for all resources. Handlers query the DB directly with inline validation — there is no service/repository layer. Exceptions: user routes delegate to `UserController.js`, and task listing/detail use `get-tasks.js`.
- `DB.js` exports a single shared `db` connection. It uses `:memory:` when `NODE_ENV=test`, otherwise `DB_PATH` or `taskr.db`. WAL mode and foreign keys are enabled.
- **Schema is duplicated**: it lives in `db/seed.js` (for the real DB) and `tests/schema.js` (for tests). Any schema change must be made in both.
- `auth.js` is a stub: `authenticate` checks the `x-api-key` header against `API_KEY` (default `dev-key`). It is only applied to `DELETE /users/:id` and `DELETE /projects/:id`.
- `sendEmail.js` is a stub that logs; `UserController.createUser` calls it on user creation.
- Circular dependency: `projectHelpers.js` lazily `require`s `routes.js` (for `getTasksForProject`), and `routes.js` lazily requires `projectHelpers.js` inside a handler. Keep these requires lazy or break the cycle when refactoring.
- Errors: most handlers respond with `{ error: message }` directly; thrown errors carrying `err.status` are turned into responses by `middleware.js`'s `errorHandler`. SQLite UNIQUE violations are detected via `err.message.includes('UNIQUE')` and mapped to 409.
- Task statuses are `active | completed | archived` (`VALID_TASK_STATUSES` in `misc/constants.js`, also enforced by a DB CHECK constraint). `PUT /tasks/:id` sets or clears `completed_at` when status changes.
- `misc/oldRoutes.js` and `misc/temp.js` are dead code (not imported anywhere). Some exports in live files are also unused: `projectHelpers.formatProjectSummary` (the only place the circular `require('./routes')` is actually reached), `paginate`/`formatError` in `misc/constants.js`, and most of `utils.js` (only `validateEmail` and `isNonEmptyString` are used). Check what calls a helper before building on it.

## Tests

- Test files should be named `<resource>.test.js` (e.g. `tasks.test.js`). The current mixed naming in `tests/` (`userTest.js`, `test-projects.js`) is a known problem that will be standardized. Don't copy it, and name every new test file `<resource>.test.js`.
- Jest only picks up files matching `package.json` `jest.testMatch`: `tests/*.test.js`, `tests/userTest.js`, `tests/test-projects.js`. A new test file must be named `*.test.js` or be added to `testMatch`, otherwise it silently won't run.
- Each test file sets `process.env.NODE_ENV = 'test'` **before** requiring `../index`/`../DB`, so the DB is in-memory; creates the schema in `beforeAll` via `tests/schema.js`; and wipes all tables in `beforeEach`. Follow the same pattern.
- Requests to authenticated routes need `.set('x-api-key', 'dev-key')`.
