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
  db.prepare('INSERT INTO users (id, name, email) VALUES (1, ?, ?)').run('Comment Author', 'author@test.com');
  db.prepare('INSERT INTO tasks (id, title) VALUES (1, ?)').run('Task with comments');
});

describe('GET /tasks/:id/comments', () => {
  test('returns an empty array when the task has no comments', async () => {
    const res = await request(app).get('/tasks/1/comments');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns comments oldest first with the author name', async () => {
    db.prepare("INSERT INTO comments (task_id, user_id, body, created_at) VALUES (1, 1, 'Second', '2026-01-02 10:00:00')").run();
    db.prepare("INSERT INTO comments (task_id, user_id, body, created_at) VALUES (1, 1, 'First', '2026-01-01 10:00:00')").run();
    const res = await request(app).get('/tasks/1/comments');
    expect(res.status).toBe(200);
    expect(res.body.map(c => c.body)).toEqual(['First', 'Second']);
    expect(res.body[0].user_name).toBe('Comment Author');
  });

  test('returns 404 when the task does not exist', async () => {
    const res = await request(app).get('/tasks/999/comments');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Task not found');
  });
});

describe('POST /tasks/:id/comments', () => {
  test('adds a comment and returns it with the author name', async () => {
    const res = await request(app)
      .post('/tasks/1/comments')
      .send({ user_id: 1, body: 'Looks good' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ task_id: 1, user_id: 1, body: 'Looks good', user_name: 'Comment Author' });
    expect(res.body.id).toBeDefined();
  });

  test('returns 404 when the task does not exist', async () => {
    const res = await request(app)
      .post('/tasks/999/comments')
      .send({ user_id: 1, body: 'Hello' });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Task not found');
  });

  test('reports a missing task before checking the comment body', async () => {
    const res = await request(app).post('/tasks/999/comments').send({});
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Task not found');
  });

  test('returns 400 when the body is missing', async () => {
    const res = await request(app).post('/tasks/1/comments').send({ user_id: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('body is required');
  });

  test('returns 400 when the body is only whitespace', async () => {
    const res = await request(app).post('/tasks/1/comments').send({ user_id: 1, body: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('body is required');
  });

  test('returns 400 when user_id is missing', async () => {
    const res = await request(app).post('/tasks/1/comments').send({ body: 'Hello' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('user_id is required');
  });

  test('returns 400 when the user does not exist', async () => {
    const res = await request(app).post('/tasks/1/comments').send({ user_id: 999, body: 'Hello' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('user not found');
  });
});
