const express = require('express');
const router = express.Router();
const { create, getAll, getById, update, remove } = require('../controllers/resumeBuilder.controller');
const { protect, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { resumeBuilderSchema } = require('../validators/schemas');

router.post('/', optionalAuth, validate(resumeBuilderSchema), create);
router.get('/', protect, getAll);
router.get('/:id', protect, getById);
router.put('/:id', protect, validate(resumeBuilderSchema), update);
router.delete('/:id', protect, remove);

module.exports = router;
