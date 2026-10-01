process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../index');

describe('GET /health', () => {
  test('reports that the API is up with the current time', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });

  test('does not accept POST requests', async () => {
    const res = await request(app).post('/health');
    expect(res.status).toBe(404);
  });
});

describe('GET /', () => {
  test('returns the API name, version and docs link', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: 'Taskr API', version: '1.0.0', docs: '/health' });
  });

  test('returns 404 for an unknown path', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
  });
});
