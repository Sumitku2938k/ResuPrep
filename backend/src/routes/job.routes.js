const express = require('express');
const router = express.Router();

const {
  getJobs,
  getJobById,
  matchJob,
  matchPastedJobDescription,
} = require('../controllers/job.controller');

const { protect, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  jobQuerySchema,
  jobIdParamSchema,
  matchJobSchema,
  matchPastedJdSchema,
} = require('../validators/schemas');

// Public / optional auth catalogue routes
router.get('/', optionalAuth, validate(jobQuerySchema, 'query'), getJobs);
router.get('/:id', optionalAuth, validate(jobIdParamSchema, 'params'), getJobById);

// Protected resume matching routes
router.post('/match', protect, validate(matchJobSchema, 'body'), matchJob);
router.post('/match-pasted', protect, validate(matchPastedJdSchema, 'body'), matchPastedJobDescription);

module.exports = router;

