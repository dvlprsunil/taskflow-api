const db = require('../db');

// Data-access layer for tasks. Every query uses parameterized placeholders.

async function list() {
  const { rows } = await db.query('SELECT * FROM tasks ORDER BY created_at DESC, id DESC');
  return rows;
}

async function getById(id) {
  const { rows } = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
  return rows[0] || null;
}

async function create({ title, description = '', status = 'todo', due_date = null }) {
  const { rows } = await db.query(
    `INSERT INTO tasks (title, description, status, due_date)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title.trim(), description, status, due_date]
  );
  return rows[0];
}

async function update(current, body) {
  const next = {
    title: body.title !== undefined ? body.title.trim() : current.title,
    description: body.description !== undefined ? body.description : current.description,
    status: body.status !== undefined ? body.status : current.status,
    due_date: body.due_date !== undefined ? body.due_date : current.due_date,
  };
  const { rows } = await db.query(
    `UPDATE tasks
     SET title = $1, description = $2, status = $3, due_date = $4, updated_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [next.title, next.description, next.status, next.due_date, current.id]
  );
  return rows[0];
}

async function remove(id) {
  const result = await db.query('DELETE FROM tasks WHERE id = $1', [id]);
  return result.rowCount > 0;
}

module.exports = { list, getById, create, update, remove };
