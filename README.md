# TaskFlow API

A RESTful task management API built with **Node.js**, **Express**, and **PostgreSQL**.

## Features

- Create, read, update, and delete tasks
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
| GET    | `/tasks`      | List all tasks     |
| GET    | `/tasks/:id`  | Get a single task  |
| POST   | `/tasks`      | Create a task      |
| PATCH  | `/tasks/:id`  | Update a task      |
| DELETE | `/tasks/:id`  | Delete a task      |

### Example

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Write docs", "due_date": "2026-10-15"}'
```

## Project structure

```
src/
  app.js          Express app setup
  server.js       Entry point (runs migrations, starts server)
  db.js           PostgreSQL connection pool
  migrate.js      Applies schema.sql
  schema.sql      Database schema
  routes/tasks.js             Route definitions
  controllers/tasksController.js  Request/response handling
  services/tasksService.js        Database access
  validators/task.js              Input validation
  utils/asyncHandler.js           Async error wrapper
tests/
  tasks.test.js   API tests
```

## Roadmap

- [ ] User authentication (JWT)
- [ ] Search and filtering
- [ ] Pagination

## License

MIT
