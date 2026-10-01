# API Conventions: Adding a New Endpoint

How to add a new endpoint to the Taskr API. This describes the **target
structure after the refactor**. Do not add new routes to `routes.js` (see
`CLAUDE.md`).

## 1. Put the route in a dedicated file under `src/routes/`

- Each resource gets its own route file in `src/routes/`.
- Name the file after the resource, **lowercase and plural**: `tasks.js`,
  `projects.js`, `comments.js`, `tags.js`, `users.js`.
- If the file for the resource already exists, add the endpoint there. Don't
  create a second file for the same resource.

## 2. Export a named Express router

Each route file creates one `express.Router()` and exports it by name:

```js
// src/routes/tags.js
const express = require('express');
const tagService = require('../services/tags');

const tagsRouter = express.Router();

// ...handlers...

module.exports = { tagsRouter };
```

## 3. Keep handlers thin: delegate to `src/services/`

- Every route handler calls a matching function in `src/services/<resource>.js`
  (e.g. `GET /tags/:id` → `tagService.getTagById(id)`).
- Handlers only read input from `req`, call the service, and send the response.
- No SQL, database access, validation rules, or other business logic in the
  handler. That belongs in the service (or in a lower layer the service calls).

```js
tagsRouter.get('/:id', (req, res, next) => {
  try {
    const tag = tagService.getTagById(Number(req.params.id));
    res.json(tag);
  } catch (err) {
    next(err);
  }
});
```

## 4. Pass errors to `next` with a status code and message

- Don't send error responses from the handler (no `res.status(404).json(...)`).
- Pass an error to `next` with `{ status, message }`. The shared `errorHandler`
  middleware turns it into `res.status(status).json({ error: message })`.

```js
tagsRouter.get('/:id', (req, res, next) => {
  try {
    const tag = tagService.getTagById(Number(req.params.id));
    if (!tag) return next({ status: 404, message: 'Tag not found' });
    res.json(tag);
  } catch (err) {
    next(err);
  }
});
```

- Services can throw errors that carry `status` and `message` (for example a
  400 for invalid input or a 409 for a UNIQUE conflict). The handler's `catch`
  passes them to `next` as they are.
- Anything without a `status` becomes a 500.

## 5. Register the router in `src/index.js`

Mount every router in `src/index.js` with `app.use`, using the resource path
and the imported router:

```js
const { tagsRouter } = require('./routes/tags');

app.use('/tags', tagsRouter);
```

Route paths inside the router are relative to that mount point (`'/'`,
`'/:id'`), not `'/tags/:id'`.

## Checklist

- [ ] Route is in `src/routes/<resources>.js` (lowercase plural), not in `routes.js`
- [ ] File exports a named Express router (`module.exports = { <resources>Router }`)
- [ ] Each handler calls a function in `src/services/<resources>.js` and has no business logic
- [ ] Errors go to `next({ status, message })` or `next(err)`, never `res.status(...).json(...)`
- [ ] Router is mounted in `src/index.js` with `app.use('/<resources>', <resources>Router)`
- [ ] Tests are added in `tests/<resources>.test.js`
