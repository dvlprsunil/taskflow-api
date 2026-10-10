process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');
const migrate = require('../src/migrate');

beforeAll(async () => {
  await migrate();
});

beforeEach(async () => {
  await db.query('TRUNCATE tasks RESTART IDENTITY');
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
    const res = await request(app).post('/tasks').send({ title: 'Write README' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Write README');
    expect(res.body.status).toBe('todo');
  });

  test('POST /tasks rejects a missing title', async () => {
    const res = await request(app).post('/tasks').send({});
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test('POST /tasks rejects an invalid status', async () => {
    const res = await request(app).post('/tasks').send({ title: 'x', status: 'blocked' });
    expect(res.status).toBe(400);
  });

  test('GET /tasks lists tasks', async () => {
    await request(app).post('/tasks').send({ title: 'One' });
    await request(app).post('/tasks').send({ title: 'Two' });
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('GET /tasks/:id returns 404 for unknown id', async () => {
    const res = await request(app).get('/tasks/999');
    expect(res.status).toBe(404);
  });

  test('GET /tasks/:id returns 400 for a non-numeric id', async () => {
    const res = await request(app).get('/tasks/abc');
    expect(res.status).toBe(400);
  });

  test('PATCH /tasks/:id updates status', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Ship it' });
    const res = await request(app).patch(`/tasks/${created.body.id}`).send({ status: 'done' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
    expect(res.body.title).toBe('Ship it');
  });

  test('DELETE /tasks/:id removes the task', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Temp' });
    const del = await request(app).delete(`/tasks/${created.body.id}`);
    expect(del.status).toBe(204);
    const get = await request(app).get(`/tasks/${created.body.id}`);
    expect(get.status).toBe(404);
  });

  describe('GET /tasks filters', () => {
    beforeEach(async () => {
      await request(app)
        .post('/tasks')
        .send({ title: 'Write docs', description: 'API reference', due_date: '2026-10-01' });
      await request(app)
        .post('/tasks')
        .send({ title: 'Fix login bug', status: 'in_progress', due_date: '2026-10-20' });
      await request(app).post('/tasks').send({ title: 'Release v1', status: 'done' });
    });

    test('filters by status', async () => {
      const res = await request(app).get('/tasks?status=in_progress');
      expect(res.status).toBe(200);
      expect(res.body.map((t) => t.title)).toEqual(['Fix login bug']);
    });

    test('rejects an invalid status', async () => {
      const res = await request(app).get('/tasks?status=blocked');
      expect(res.status).toBe(400);
    });

    test('searches title and description case-insensitively', async () => {
      const byTitle = await request(app).get('/tasks?q=LOGIN');
      expect(byTitle.body.map((t) => t.title)).toEqual(['Fix login bug']);

      const byDescription = await request(app).get('/tasks?q=reference');
      expect(byDescription.body.map((t) => t.title)).toEqual(['Write docs']);
    });

    test('filters by due date range', async () => {
      const res = await request(app).get('/tasks?due_after=2026-10-05&due_before=2026-10-31');
      expect(res.body.map((t) => t.title)).toEqual(['Fix login bug']);
    });

    test('rejects an invalid date', async () => {
      const res = await request(app).get('/tasks?due_before=not-a-date');
      expect(res.status).toBe(400);
    });

    test('combines filters', async () => {
      const res = await request(app).get('/tasks?status=todo&q=docs');
      expect(res.body.map((t) => t.title)).toEqual(['Write docs']);
    });
  });
});
