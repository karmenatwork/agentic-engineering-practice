process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../index');
const { db } = require('../DB');
const { createSchema } = require('./schema');

beforeAll(() => {
  createSchema(db);
});

beforeEach(() => {
  db.exec('DELETE FROM task_tags; DELETE FROM comments; DELETE FROM tasks; DELETE FROM projects; DELETE FROM users; DELETE FROM tags;');
  db.prepare('INSERT INTO users (id, name, email) VALUES (1, ?, ?)').run('Test User', 'test@example.com');
  db.prepare('INSERT INTO projects (id, name) VALUES (1, ?)').run('Test Project');
});

describe('GET /tasks', () => {
  test('returns empty array when no tasks', async () => {
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns all tasks', async () => {
    db.prepare("INSERT INTO tasks (title, status) VALUES ('Task A', 'active')").run();
    db.prepare("INSERT INTO tasks (title, status) VALUES ('Task B', 'completed')").run();
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('filters by ?status=active', async () => {
    db.prepare("INSERT INTO tasks (title, status) VALUES ('Active Task', 'active')").run();
    db.prepare("INSERT INTO tasks (title, status) VALUES ('Done Task', 'completed')").run();
    const res = await request(app).get('/tasks?status=active');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Active Task');
  });

  test('filters by ?status=completed', async () => {
    db.prepare("INSERT INTO tasks (title, status) VALUES ('Active Task', 'active')").run();
    db.prepare("INSERT INTO tasks (title, status) VALUES ('Done Task', 'completed')").run();
    const res = await request(app).get('/tasks?status=completed');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Done Task');
  });

  test('returns 400 for invalid status value', async () => {
    const res = await request(app).get('/tasks?status=invalid');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/status must be one of/);
  });

  describe('filtering by ?tag', () => {
    beforeEach(() => {
      db.prepare("INSERT INTO tasks (id, title, status) VALUES (1, 'Fix login bug', 'active')").run();
      db.prepare("INSERT INTO tasks (id, title, status) VALUES (2, 'Write docs', 'active')").run();
      db.prepare("INSERT INTO tasks (id, title, status) VALUES (3, 'Ship release', 'completed')").run();
      db.prepare("INSERT INTO tags (id, name) VALUES (1, 'urgent'), (2, 'docs')").run();
      db.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (1, 1), (1, 2), (2, 2), (3, 1)').run();
    });

    test('returns only tasks that have the given tag', async () => {
      const res = await request(app).get('/tasks?tag=urgent');
      expect(res.status).toBe(200);
      expect(res.body.map(t => t.title).sort()).toEqual(['Fix login bug', 'Ship release']);
    });

    test('matches the tag name regardless of case and surrounding spaces', async () => {
      const res = await request(app).get('/tasks?tag=%20URGENT%20');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    test('combines the tag filter with other filters', async () => {
      const res = await request(app).get('/tasks?tag=urgent&status=active');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Fix login bug');
    });

    test('returns each matching task once with its own fields', async () => {
      const res = await request(app).get('/tasks?tag=docs');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.map(t => t.id).sort()).toEqual([1, 2]);
      expect(res.body[0]).toHaveProperty('status', 'active');
    });

    test('returns an empty array for a tag that does not exist', async () => {
      const res = await request(app).get('/tasks?tag=nope');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test('rejects an empty tag', async () => {
      const res = await request(app).get('/tasks?tag=%20');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('tag must be a non-empty tag name');
    });

    test('rejects more than one tag', async () => {
      const res = await request(app).get('/tasks?tag=urgent&tag=docs');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('tag must be a non-empty tag name');
    });
  });
});

describe('POST /tasks', () => {
  test('creates a task with valid data', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'New Task', description: 'Do the thing' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New Task');
    expect(res.body.status).toBe('active');
    expect(res.body.id).toBeDefined();
  });

  test('creates a task assigned to a project', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Project Task', project_id: 1 });
    expect(res.status).toBe(201);
    expect(res.body.project_id).toBe(1);
  });

  test('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ description: 'No title here' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('returns 400 when title is empty string', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: '   ' });
    expect(res.status).toBe(400);
  });
});

describe('GET /tasks/:id', () => {
  test('returns task by id', async () => {
    const result = db.prepare("INSERT INTO tasks (title) VALUES ('Find Me')").run();
    const res = await request(app).get(`/tasks/${result.lastInsertRowid}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Find Me');
    expect(res.body.tags).toBeDefined();
    expect(res.body.comments).toBeDefined();
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app).get('/tasks/99999');
    expect(res.status).toBe(404);
  });
});

describe('PUT /tasks/:id', () => {
  test('updates task status to completed', async () => {
    const result = db.prepare("INSERT INTO tasks (title, status) VALUES ('Update Me', 'active')").run();
    const taskId = result.lastInsertRowid;
    const res = await request(app)
      .put(`/tasks/${taskId}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');
    expect(res.body.completed_at).not.toBeNull();
  });

  test('updates task title', async () => {
    const result = db.prepare("INSERT INTO tasks (title) VALUES ('Old Title')").run();
    const taskId = result.lastInsertRowid;
    const res = await request(app)
      .put(`/tasks/${taskId}`)
      .send({ title: 'New Title' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New Title');
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app).put('/tasks/99999').send({ title: 'Ghost' });
    expect(res.status).toBe(404);
  });

  test('returns 400 for invalid status', async () => {
    const result = db.prepare("INSERT INTO tasks (title) VALUES ('Status Test')").run();
    const res = await request(app)
      .put(`/tasks/${result.lastInsertRowid}`)
      .send({ status: 'bogus' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /tasks/:id', () => {
  test('deletes a task', async () => {
    const result = db.prepare("INSERT INTO tasks (title) VALUES ('Delete Me')").run();
    const taskId = result.lastInsertRowid;
    const res = await request(app).delete(`/tasks/${taskId}`);
    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(true);

    const check = await request(app).get(`/tasks/${taskId}`);
    expect(check.status).toBe(404);
  });

  test('returns 404 when task does not exist', async () => {
    const res = await request(app).delete('/tasks/99999');
    expect(res.status).toBe(404);
  });
});
