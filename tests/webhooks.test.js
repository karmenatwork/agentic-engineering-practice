process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../index');

describe('POST /webhooks/task-update', () => {
  test('acknowledges a task update payload', async () => {
    const res = await request(app)
      .post('/webhooks/task-update')
      .send({ task_id: 1, status: 'completed' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
  });

  test('acknowledges a request with no body', async () => {
    const res = await request(app).post('/webhooks/task-update');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
  });

  test('returns 400 when the body is malformed JSON', async () => {
    const res = await request(app)
      .post('/webhooks/task-update')
      .set('Content-Type', 'application/json')
      .send('{"task_id": 1,');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('does not accept GET requests', async () => {
    const res = await request(app).get('/webhooks/task-update');
    expect(res.status).toBe(404);
  });
});
