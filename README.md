# TaskFlow API

A RESTful task management API built with **Node.js**, **Express**, and **PostgreSQL**.

## Features

- User registration and login with JWT authentication
- Create, read, update, and delete tasks (scoped to the logged-in user)
- Task status tracking (`todo`, `in_progress`, `done`)
- Due dates
- Input validation and parameterized queries
- Automated tests with Jest and Supertest

## Getting started

### 1. Start PostgreSQL

With Docker (easiest):

```bash
docker compose up -d
```

Or use a local PostgreSQL install and create two databases: `taskflow` and `taskflow_test`.

### 2. Configure environment

```bash
cp .env.example .env
# edit .env if your PostgreSQL credentials differ
# and set JWT_SECRET to a long random string, e.g. `openssl rand -hex 32`
```

### 3. Install and run

```bash
npm install
npm run db:migrate   # creates the tables
npm start            # runs on http://localhost:3000
npm test             # runs the test suite against taskflow_test
```

## API

| Method | Endpoint      | Description        |
|--------|---------------|--------------------|
| GET    | `/health`     | Health check       |
| POST   | `/auth/register` | Create an account, returns a token |
| POST   | `/auth/login` | Log in, returns a token |
| GET    | `/tasks`      | List all tasks     |
| GET    | `/tasks/:id`  | Get a single task  |
| POST   | `/tasks`      | Create a task      |
| PATCH  | `/tasks/:id`  | Update a task      |
| DELETE | `/tasks/:id`  | Delete a task      |

All `/tasks` endpoints require an `Authorization: Bearer <token>` header. Tokens expire after one hour.

### Example

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "me@example.com", "password": "password123"}' | jq -r .token)

curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Write docs", "due_date": "2026-10-15"}'
```

## Project structure

```
src/
  app.js          Express app setup
  server.js       Entry point (runs migrations, starts server)
  db.js           PostgreSQL connection pool
  auth.js         JWT signing and verification
  migrate.js      Applies schema.sql
  schema.sql      Database schema
  middleware/requireAuth.js  Bearer token check
  routes/auth.js  Register and login endpoints
  routes/tasks.js Task endpoints
tests/
  auth.test.js    Auth API tests
  tasks.test.js   Task API tests
```

## Roadmap

- [x] User authentication (JWT)
- [ ] Search and filtering
- [ ] Pagination

## License

MIT
