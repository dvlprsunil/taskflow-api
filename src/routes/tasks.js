const express = require('express');
const db = require('../db');

const router = express.Router();

const VALID_STATUSES = ['todo', 'in_progress', 'done'];

function validateTask(body, { partial = false } = {}) {
  const errors = [];
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim() === '') {
      errors.push('title is required and must be a non-empty string');
    }
  }
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  if (body.due_date !== undefined && body.due_date !== null && isNaN(Date.parse(body.due_date))) {
    errors.push('due_date must be a valid date');
  }
  return errors;
}

function isValidId(id) {
  return /^\d+$/.test(id);
}

// Wraps async handlers so rejected promises reach the error handler
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// GET /tasks - list the current user's tasks
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC, id DESC',
      [req.user.id]
    );
    res.json(rows);
  })
);

// GET /tasks/:id - get a single task
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid task id' });
    const { rows } = await db.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.user.id,
    ]);
    if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(rows[0]);
  })
);

// POST /tasks - create a task
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const errors = validateTask(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const { title, description = '', status = 'todo', due_date = null } = req.body;
    const { rows } = await db.query(
      `INSERT INTO tasks (title, description, status, due_date, user_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title.trim(), description, status, due_date, req.user.id]
    );
    res.status(201).json(rows[0]);
  })
);

// PATCH /tasks/:id - update a task
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid task id' });

    const existing = await db.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.user.id,
    ]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

    const errors = validateTask(req.body, { partial: true });
    if (errors.length) return res.status(400).json({ errors });

    const current = existing.rows[0];
    const updated = {
      title: req.body.title !== undefined ? req.body.title.trim() : current.title,
      description: req.body.description !== undefined ? req.body.description : current.description,
      status: req.body.status !== undefined ? req.body.status : current.status,
      due_date: req.body.due_date !== undefined ? req.body.due_date : current.due_date,
    };

    const { rows } = await db.query(
      `UPDATE tasks
       SET title = $1, description = $2, status = $3, due_date = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [updated.title, updated.description, updated.status, updated.due_date, current.id]
    );
    res.json(rows[0]);
  })
);

// DELETE /tasks/:id - delete a task
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid task id' });
    const result = await db.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.user.id,
    ]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Task not found' });
    res.status(204).send();
  })
);

module.exports = router;
