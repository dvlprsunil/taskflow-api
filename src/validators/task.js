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

module.exports = { VALID_STATUSES, validateTask, isValidId };
