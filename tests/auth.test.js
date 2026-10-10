process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');
const migrate = require('../src/migrate');

beforeAll(async () => {
  await migrate();
});

beforeEach(async () => {
  await db.query('TRUNCATE tasks, users RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  await db.pool.end();
});

describe('Auth API', () => {
  const credentials = { email: 'ada@example.com', password: 'correct-horse' };

  test('POST /auth/register creates a user and returns a token', async () => {
    const res = await request(app).post('/auth/register').send(credentials);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('ada@example.com');
    expect(res.body.user.password_hash).toBeUndefined();
    expect(typeof res.body.token).toBe('string');
  });

  test('POST /auth/register rejects a duplicate email', async () => {
    await request(app).post('/auth/register').send(credentials);
    const res = await request(app)
      .post('/auth/register')
      .send({ ...credentials, email: 'ADA@example.com' });
    expect(res.status).toBe(409);
  });

  test('POST /auth/register rejects a short password', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'ada@example.com', password: 'short' });
    expect(res.status).toBe(400);
  });

  test('POST /auth/login returns a token for valid credentials', async () => {
    await request(app).post('/auth/register').send(credentials);
    const res = await request(app).post('/auth/login').send(credentials);
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });

  test('POST /auth/login rejects a wrong password', async () => {
    await request(app).post('/auth/register').send(credentials);
    const res = await request(app)
      .post('/auth/login')
      .send({ ...credentials, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  test('GET /tasks requires a token', async () => {
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(401);
  });

  test('GET /tasks rejects an invalid token', async () => {
    const res = await request(app).get('/tasks').set('Authorization', 'Bearer not-a-token');
    expect(res.status).toBe(401);
  });

  test('users cannot see each other\'s tasks', async () => {
    const alice = (await request(app).post('/auth/register').send(credentials)).body.token;
    const bob = (
      await request(app)
        .post('/auth/register')
        .send({ email: 'bob@example.com', password: 'password123' })
    ).body.token;

    const created = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${alice}`)
      .send({ title: 'Alice only' });

    const list = await request(app).get('/tasks').set('Authorization', `Bearer ${bob}`);
    expect(list.body).toHaveLength(0);

    const get = await request(app)
      .get(`/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${bob}`);
    expect(get.status).toBe(404);
  });
});
