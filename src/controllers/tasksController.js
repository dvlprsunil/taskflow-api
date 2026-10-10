const tasksService = require('../services/tasksService');
const { validateTask, isValidId } = require('../validators/task');

async function list(req, res) {
  res.json(await tasksService.list());
}

async function getOne(req, res) {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid task id' });
  const task = await tasksService.getById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
}

async function create(req, res) {
  const errors = validateTask(req.body);
  if (errors.length) return res.status(400).json({ errors });
  const task = await tasksService.create(req.body);
  res.status(201).json(task);
}

async function update(req, res) {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid task id' });
  const current = await tasksService.getById(req.params.id);
  if (!current) return res.status(404).json({ error: 'Task not found' });

  const errors = validateTask(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ errors });

  res.json(await tasksService.update(current, req.body));
}

async function remove(req, res) {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid task id' });
  const deleted = await tasksService.remove(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Task not found' });
  res.status(204).send();
}

module.exports = { list, getOne, create, update, remove };
