# Testing Standards: Writing Tests for the Taskr API

How to write tests for the Taskr API. Follow these rules for every new or
changed endpoint.

## 1. Name test files `<resource>.test.js`

- One test file per resource, in `tests/`, named after the resource in
  **lowercase plural**: `tasks.test.js`, `projects.test.js`, `users.test.js`,
  `comments.test.js`, `tags.test.js`.
- This matches the route file name (`src/routes/<resource>.js`, see
  `api-conventions.md`).
- Don't copy the old names (`userTest.js`, `test-projects.js`). They are a known
  problem that will be standardized.
- Jest only runs files matching `jest.testMatch` in `package.json`, and
  `tests/*.test.js` is already on that list. A file with any other name
  silently won't run.

## 2. Use Jest + supertest against an in-memory SQLite database

Tests need no external setup: no running server, no database file, no seed
step. Every test file starts the same way:

```js
process.env.NODE_ENV = 'test'; // must come before requiring the app or DB

const request = require('supertest');
const app = require('../index');
const { db } = require('../DB');
const { createSchema } = require('./schema');

beforeAll(() => {
  createSchema(db);
});

beforeEach(() => {
  db.exec('DELETE FROM task_tags; DELETE FROM comments; DELETE FROM tasks; DELETE FROM projects; DELETE FROM users; DELETE FROM tags;');
  // insert only the fixtures this file needs
});
```

- `NODE_ENV=test` makes `DB.js` use `:memory:`. Setting it after the
  `require`s connects to the real `taskr.db` instead.
- Send requests with `request(app)`. Never call `app.listen` or hit
  `localhost`.
- Wipe every table in `beforeEach` so each test starts from a known state and
  tests don't depend on each other's order.
- Authenticated routes need `.set('x-api-key', 'dev-key')`.
- Schema changes go in both `tests/schema.js` and `db/seed.js`.
- (After the refactor, update the paths to `../src/index` and `../src/DB`
  etc. Everything else stays the same.)

## 3. Cover the happy path and at least two error cases per endpoint

Group tests by endpoint with one `describe` block per method + path. Each block
has:

- **At least one happy-path test**: a valid request, checking the status code
  and the response body (and the DB state, for writes).
- **At least two error-case tests**, for example:
  - missing or invalid input → `400`
  - resource doesn't exist → `404`
  - duplicate value (UNIQUE) → `409`
  - missing or wrong API key on a protected route → `401`

Assert on the status code **and** the error body (`{ error: '...' }`), not only
the status.

```js
describe('POST /tags', () => {
  test('creates a tag and returns it', async () => {
    const res = await request(app).post('/tags').send({ name: 'urgent' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'urgent' });
  });

  test('rejects a tag without a name', async () => {
    const res = await request(app).post('/tags').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('rejects a tag name that already exists', async () => {
    await request(app).post('/tags').send({ name: 'urgent' });
    const res = await request(app).post('/tags').send({ name: 'urgent' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
  });
});
```

## 4. Describe behavior in plain English

Test names describe what the endpoint does from the client's point of view,
not how it's implemented.

| Good | Bad |
| --- | --- |
| `returns only active tasks when filtered by status` | `runs SELECT with WHERE status = ?` |
| `rejects a user with an email that is already taken` | `catches UNIQUE constraint error` |
| `sets the completion date when a task is marked completed` | `calls updateCompletedAt helper` |

Test through the HTTP API. Don't unit-test route internals or call service
functions directly from these files.

## 5. `npm test` must pass with no other setup

- `npm test` runs the whole suite. It must work on a fresh clone after
  `npm install`, with no `db:seed`, env vars, or running server.
- Tests must not read or write `taskr.db`, call the network, or depend on
  execution order.
- Run a single file while working: `npx jest tests/<resource>.test.js`.
- Before finishing, run the full `npm test` and make sure it passes.

## Checklist

- [ ] File is `tests/<resource>.test.js` (lowercase plural)
- [ ] `process.env.NODE_ENV = 'test'` is set before any `require` of the app/DB
- [ ] Schema is created in `beforeAll` and tables are wiped in `beforeEach`
- [ ] Every endpoint has a happy-path test and at least two error-case tests
- [ ] Error tests check both the status code and the `{ error }` body
- [ ] Test names describe behavior in plain English, not implementation
- [ ] `npm test` passes with no other setup
