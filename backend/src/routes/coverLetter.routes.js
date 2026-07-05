const express = require('express');
const router = express.Router();
const { generate, getAll, update, remove } = require('../controllers/coverLetter.controller');
const { protect, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { coverLetterSchema } = require('../validators/schemas');

router.post('/generate', optionalAuth, validate(coverLetterSchema), generate);
router.get('/', protect, getAll);
router.put('/:id', protect, update);
router.delete('/:id', protect, remove);

module.exports = router;
