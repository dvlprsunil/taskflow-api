const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/tasksController');

const router = express.Router();

router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.getOne));
router.post('/', asyncHandler(controller.create));
router.patch('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

module.exports = router;
