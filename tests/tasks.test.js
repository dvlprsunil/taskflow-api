process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');
const migrate = require('../src/migrate');
const { registerUser } = require('./helpers/auth');

let token;
const auth = () => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  await migrate();
});

beforeEach(async () => {
  await db.query('TRUNCATE tasks, users RESTART IDENTITY CASCADE');
  token = await registerUser();
});

afterAll(async () => {
  await db.pool.end();
});

describe('Tasks API', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('POST /tasks creates a task', async () => {
    const res = await request(app).post('/tasks').set(auth()).send({ title: 'Write README' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Write README');
    expect(res.body.status).toBe('todo');
  });

  test('POST /tasks rejects a missing title', async () => {
    const res = await request(app).post('/tasks').set(auth()).send({});
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test('POST /tasks rejects an invalid status', async () => {
    const res = await request(app)
      .post('/tasks')
      .set(auth())
      .send({ title: 'x', status: 'blocked' });
    expect(res.status).toBe(400);
  });

  test('GET /tasks lists tasks', async () => {
    await request(app).post('/tasks').set(auth()).send({ title: 'One' });
    await request(app).post('/tasks').set(auth()).send({ title: 'Two' });
    const res = await request(app).get('/tasks').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('GET /tasks/:id returns 404 for unknown id', async () => {
    const res = await request(app).get('/tasks/999').set(auth());
    expect(res.status).toBe(404);
  });

  test('GET /tasks/:id returns 400 for a non-numeric id', async () => {
    const res = await request(app).get('/tasks/abc').set(auth());
    expect(res.status).toBe(400);
  });

  test('PATCH /tasks/:id updates status', async () => {
    const created = await request(app).post('/tasks').set(auth()).send({ title: 'Ship it' });
    const res = await request(app)
      .patch(`/tasks/${created.body.id}`)
      .set(auth())
      .send({ status: 'done' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
    expect(res.body.title).toBe('Ship it');
  });

  test('DELETE /tasks/:id removes the task', async () => {
    const created = await request(app).post('/tasks').set(auth()).send({ title: 'Temp' });
    const del = await request(app).delete(`/tasks/${created.body.id}`).set(auth());
    expect(del.status).toBe(204);
    const get = await request(app).get(`/tasks/${created.body.id}`).set(auth());
    expect(get.status).toBe(404);
  });
});
